import { useState, useRef } from 'react';
import { db, setDoc, doc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { User } from 'firebase/auth';
import { GrammarPage, GrammarElement, ElementType, VignetteData, TableData, ListData } from '../types';
import { ElementRenderer } from './Elements';
import { 
  Save, X, Columns, Square, Plus, Type, List, Table, 
  StickyNote, MessageSquare, Quote, Layers, Check, Share2, Globe, Eye, Download, FileJson, FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface EditorProps {
  page: GrammarPage;
  user: User | null;
  onClose: () => void;
}

export default function Editor({ page: initialPage, user, onClose }: EditorProps) {
  const [page, setPage] = useState<GrammarPage>(initialPage);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isPreview, setIsPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addElement = (type: ElementType) => {
    const newElement: GrammarElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: getInitialContent(type)
    };
    setPage(prev => ({ ...prev, elements: [...prev.elements, newElement] }));
  };

  const getInitialContent = (type: ElementType) => {
    switch(type) {
      case 'text-box': return '';
      case 'example-single': return '';
      case 'example-multi': return [''];
      case 'vignette': return { speaker1: 'Lui', text1: '', speaker2: 'Lei', text2: '' };
      case 'sticker': return '';
      case 'note': return '';
      case 'list': return { items: [''], style: 'bullet' };
      case 'table': return { headers: ['Case', 'Example'], rows: [['', '']] };
      default: return '';
    }
  };

  const updateElement = (id: string, content: any) => {
    setPage(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, content } : el)
    }));
  };

  const removeElement = (id: string) => {
    setPage(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id)
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      const docId = page.id || Math.random().toString(36).substr(2, 12);
      const docRef = doc(db, "creations", docId);
      
      const saveData = {
        ...page,
        id: docId,
        updatedAt: serverTimestamp(),
        createdAt: page.id ? page.createdAt : serverTimestamp()
      };
      
      await setDoc(docRef, saveData, { merge: true });
      setPage(prev => ({ ...prev, id: docId }));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      handleFirestoreError(error, OperationType.WRITE, "creations");
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    const wasPreview = isPreview;
    setIsPreview(true);
    
    // Give more time for the layout to stabilize and animations to finish
    setTimeout(async () => {
      try {
        const element = canvasRef.current;
        if (!element) return;

        const canvas = await html2canvas(element, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#F4F4F2',
          logging: false,
          imageTimeout: 20000,
          windowWidth: 1200, // Force a desktop-like width for the capture
          onclone: (clonedDoc) => {
            // Force-disable all animations and transitions in the clone
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              * { 
                transition: none !important; 
                animation: none !important; 
                transform: none !important; 
                box-shadow: none !important;
              }
              .bg-dots { background: #F4F4F2 !important; }
              header h1 { letter-spacing: -1px !important; }
            `;
            clonedDoc.head.appendChild(style);
            
            // Fix potential viewport issues in the clone
            const clonedCanvas = clonedDoc.querySelector('.max-w-4xl');
            if (clonedCanvas) {
              (clonedCanvas as HTMLElement).style.width = '900px';
              (clonedCanvas as HTMLElement).style.maxWidth = 'none';
            }
          }
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.82);
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4',
          compress: true
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'MEDIUM');
        pdf.save(`${page.title || 'grammar-page'}.pdf`);
      } catch (error) {
        console.error('PDF Export Error:', error);
        alert('Si è verificato un errore durante la creazione del PDF. Se il problema persiste, prova a usare la funzione "Stampa" del tuo browser e seleziona "Salva come PDF".');
      } finally {
        setExporting(false);
        if (!wasPreview) setIsPreview(false);
      }
    }, 1800);
  };

  const exportHTML = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <title>${page.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
          body { font-family: 'Inter', sans-serif; background: white; color: black; padding: 60px; margin: 0; }
          .container { max-width: 900px; margin: 0 auto; border: 4px solid black; padding: 40px; box-shadow: 12px 12px 0px 0px black; position: relative; overflow: hidden; }
          .dots { position: fixed; inset: 0; background-image: radial-gradient(black 1px, transparent 1px); background-size: 24px 24px; z-index: -1; opacity: 0.1; }
          h1 { text-transform: uppercase; letter-spacing: -4px; font-size: 5rem; line-height: 0.8; margin-bottom: 20px; background: #FFFF00; display: inline-block; padding: 0 10px; border: 3px solid black; transform: rotate(-1deg); box-shadow: 6px 6px 0px 0px black; }
          p.desc { color: black; font-size: 1.5rem; font-weight: 900; margin-bottom: 50px; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: ${page.layout === 'double' ? '1fr 1fr' : '1fr'}; gap: 30px; }
          .card { background: white; border: 3px solid black; padding: 30px; position: relative; box-shadow: 6px 6px 0px 0px black; }
          .label { background: black; color: white; display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; position: absolute; top: -15px; left: 20px; border: 2px solid black; }
          .example { border-left: 8px solid black; padding-left: 20px; font-style: italic; font-weight: 900; font-size: 1.2rem; background: rgba(255, 255, 0, 0.1); py: 10px; }
          .sticker { background: #00FF00; padding: 25px; border: 3px solid black; font-family: monospace; transform: rotate(-1deg); box-shadow: 6px 6px 0px 0px black; font-weight: 900; }
          .vignette { display: flex; flex-direction: column; gap: 20px; }
          .bubble { padding: 15px; border: 3px solid black; font-weight: 900; box-shadow: 4px 4px 0px 0px black; }
          .speaker { font-weight: 900; font-size: 11px; text-transform: uppercase; background: black; color: white; padding: 2px 8px; display: inline-block; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; border: 4px solid black; box-shadow: 6px 6px 0px 0px black; }
          th, td { border: 2px solid black; padding: 15px; text-align: left; font-weight: 700; }
          th { background: #00FFFF; font-size: 12px; text-transform: uppercase; font-weight: 900; }
          ul { list-style: none; padding: 0; }
          li { margin-bottom: 10px; font-weight: 900; display: flex; gap: 10px; align-items: center; }
          li::before { content: '★'; color: #FFFF00; -webkit-text-stroke: 1px black; font-size: 1.2rem; }
        </style>
      </head>
      <body>
        <div class="dots"></div>
        <div class="container">
          <h1>${page.title}</h1>
          <p class="desc">${page.description}</p>
          <div class="grid">
            ${page.elements.map(el => `
              <div class="card">
                <div class="label" style="background: ${getLabelColor(el.type)}">${el.type.replace('-', ' ')}</div>
                ${renderElementHTML(el)}
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.title || 'grammar-page'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLabelColor = (type: string) => {
    switch(type) {
      case 'vignette': return '#FF00FF';
      case 'sticker': return '#00FF00';
      case 'example-single':
      case 'example-multi': return '#FFFF00';
      case 'table':
      case 'note':
      case 'text-box':
      case 'list': return '#00FFFF';
      default: return 'black';
    }
  };

  const renderElementHTML = (el: GrammarElement) => {
    switch(el.type) {
      case 'text-box': return `<p style="font-weight: 900;">${el.content}</p>`;
      case 'example-single': return `<div class="example">${el.content}</div>`;
      case 'example-multi': 
        const exs = Array.isArray(el.content) ? el.content : [];
        return `<div style="display: flex; flex-direction: column; gap: 10px;">${exs.map(ex => `<div class="example">${ex}</div>`).join('')}</div>`;
      case 'sticker': return `<div class="sticker">${el.content}</div>`;
      case 'table': 
        const t = el.content as TableData;
        return `
          <table>
            <thead><tr>${t.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        `;
      case 'vignette':
        const v = el.content as VignetteData;
        return `
          <div class="vignette">
            <div><span class="speaker">${v.speaker1}</span><div class="bubble" style="background: #00FFFF">${v.text1}</div></div>
            <div style="text-align: right;"><span class="speaker">${v.speaker2}</span><div class="bubble" style="background: #FF00FF; color: white;">${v.text2}</div></div>
          </div>
        `;
      case 'list':
        const l = el.content as ListData;
        return `<ul>${l.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
      case 'note':
        return `<div style="border: 2px solid black; padding: 15px; background: #EFEFEF; font-weight: 700;">${el.content}</div>`;
      default: return el.content;
    }
  };

  const tools = [
    { type: 'text-box', icon: Type, label: 'Paragrafo' },
    { type: 'example-single', icon: Quote, label: 'Esempio Singolo' },
    { type: 'example-multi', icon: Layers, label: 'Esempi Multipli' },
    { type: 'table', icon: Table, label: 'Tabella' },
    { type: 'list', icon: List, label: 'Lista' },
    { type: 'vignette', icon: MessageSquare, label: 'Vignetta Dialogue' },
    { type: 'sticker', icon: StickyNote, label: 'Nota Sticker' },
    { type: 'note', icon: Globe, label: 'Approfondimento' },
  ];

  return (
    <div className={`flex flex-col lg:flex-row gap-8 items-start ${isPreview ? 'preview-mode' : ''}`}>
      {/* Tools Sidebar */}
      {!isPreview && (
        <aside className="w-full lg:w-64 lg:sticky lg:top-[84px] space-y-6 no-print">
          <div className="bg-accent-yellow border-3 border-ink p-6 shadow-hard -rotate-1">
            <h3 className="text-[11px] uppercase tracking-widest text-ink font-black mb-5 border-b-2 border-ink pb-2">📦 Elementi</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {tools.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => addElement(tool.type as ElementType)}
                  className="flex items-center gap-3 w-full p-2.5 border-3 border-ink bg-white hover:bg-accent-cyan transition-all text-ink group shadow-hard-sm active:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0"
                >
                  <div className="w-7 h-7 flex items-center justify-center text-ink group-hover:scale-125 transition-transform">
                    <tool.icon size={16} strokeWidth={3} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-tight">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border-3 border-ink p-6 shadow-hard rotate-1">
            <h3 className="text-[11px] uppercase tracking-widest text-ink font-black mb-5 border-b-2 border-ink pb-2">⚙️ Config</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setPage(p => ({ ...p, layout: p.layout === 'single' ? 'double' : 'single' }))}
                className="flex items-center gap-3 w-full p-2.5 border-3 border-ink bg-accent-orange text-white hover:bg-orange-600 transition-all font-black uppercase text-[10px] shadow-hard-sm active:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0"
              >
                {page.layout === 'double' ? <Columns size={16} strokeWidth={3} /> : <Square size={16} strokeWidth={3} />}
                {page.layout === 'double' ? 'Griglia 2 Col' : 'Lista Singola'}
              </button>
               <button 
                onClick={() => setPage(p => ({ ...p, isPublic: !p.isPublic }))}
                className="flex items-center gap-3 w-full p-2.5 border-3 border-ink bg-accent-cyan text-ink hover:bg-cyan-300 transition-all font-black uppercase text-[10px] shadow-hard-sm active:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0"
              >
                <Share2 size={16} strokeWidth={3} />
                {page.isPublic ? 'Visibile a Tutti' : 'Solo per Me'}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Canvas Area */}
      <div className="flex-grow w-full space-y-8">
        {/* Editor Toolbar */}
        <div className="bg-white border-4 border-ink p-5 flex items-center justify-between shadow-hard no-print">
          <div className="flex items-center gap-4 flex-grow max-w-md">
            <input 
              value={page.title}
              onChange={(e) => setPage(p => ({ ...p, title: e.target.value }))}
              readOnly={isPreview}
              className={`text-3xl font-black uppercase tracking-tighter bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-ink/10 ${isPreview ? 'cursor-default' : ''}`}
              placeholder="NOME LEZIONE"
            />
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setIsPreview(!isPreview)}
              disabled={exporting}
              className={`p-3 border-3 border-ink transition-all flex items-center gap-2 font-black uppercase text-[11px] shadow-hard-sm active:shadow-none ${isPreview ? 'bg-accent-yellow' : 'bg-white hover:bg-accent-cyan'} ${exporting ? 'opacity-50' : ''}`}
            >
              <Eye size={18} strokeWidth={3} /> <span className="hidden md:inline">{isPreview ? 'Torna a Edit' : 'Anteprima'}</span>
            </button>

            <div className="flex items-center gap-2 border-l-4 border-ink/10 pl-4">
              <button 
                onClick={exportPDF} 
                disabled={exporting}
                className="p-3 border-3 border-ink bg-white hover:bg-accent-lime transition-all flex items-center gap-2 font-black uppercase text-[11px] shadow-hard-sm active:shadow-none disabled:opacity-50"
              >
                <Download size={18} strokeWidth={3} className={exporting ? 'animate-bounce' : ''} /> 
                <span className="hidden md:inline">{exporting ? 'Wait...' : 'PDF'}</span>
              </button>
              <button 
                onClick={exportHTML} 
                disabled={exporting}
                className="p-3 border-3 border-ink bg-white hover:bg-accent-cyan transition-all flex items-center gap-2 font-black uppercase text-[11px] shadow-hard-sm active:shadow-none"
              >
                <FileCode size={18} strokeWidth={3} /> <span className="hidden md:inline">HTML</span>
              </button>
            </div>

            <div className="flex items-center gap-4 border-l-4 border-ink/10 pl-4">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-accent-pink text-white px-8 py-3 border-3 border-ink font-black text-[12px] uppercase hover:bg-red-600 shadow-hard-sm active:shadow-none disabled:opacity-50 transition-all"
              >
                {saving ? '...' : 'Salva'}
              </button>
              <button 
                onClick={onClose}
                className="p-2 bg-white border-3 border-ink hover:bg-red-500 hover:text-white transition-all shadow-hard-sm active:shadow-none"
              >
                <X size={24} strokeWidth={4} />
              </button>
            </div>
          </div>
        </div>

        {/* The Page - Bento Canvas */}
        <div 
          ref={canvasRef}
          className={`bg-white border-4 border-ink p-10 md:p-14 shadow-hard bg-dots min-h-[90vh] transition-all relative overflow-hidden ${isPreview ? 'shadow-none md:p-20' : ''}`}
        >
          {/* Decorative Corner Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-yellow border-b-4 border-l-4 border-ink rotate-45 translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-accent-cyan border-t-4 border-r-4 border-ink -rotate-45 -translate-x-8 translate-y-8"></div>

          <div className="max-w-4xl mx-auto space-y-16 relative z-10">
            <header className="space-y-6 text-center pb-12 border-b-4 border-ink/20">
               <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-4 bg-accent-yellow inline-block px-4 border-3 border-ink shadow-hard-sm -rotate-1">{page.title}</h1>
               {isPreview ? (
                 <p className="w-full text-center font-black text-ink/70 text-xl tracking-tight">{page.description}</p>
               ) : (
                 <textarea 
                  value={page.description}
                  onChange={(e) => setPage(p => ({ ...p, description: e.target.value }))}
                  className="w-full text-center bg-white border-3 border-ink p-4 shadow-hard focus:ring-0 font-black text-ink text-xl resize-none min-h-[4rem]"
                  placeholder="SOTTOTITOLO O DESCRIZIONE..."
                 />
               )}
            </header>

            <div className={page.layout === 'double' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}>
              {page.elements.map((el) => (
                <ElementRenderer 
                  key={el.id} 
                  element={el} 
                  isEditing={!isPreview}
                  onUpdate={updateElement}
                  onRemove={removeElement}
                />
              ))}
              
              {page.elements.length === 0 && (
                <div className="col-span-full py-32 text-center">
                   <p className="text-ink/20 font-black uppercase text-xl tracking-widest">Workspace Vuoto</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
