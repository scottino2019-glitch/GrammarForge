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
    
    // Wait longer for the UI to update to preview mode and for fonts/assets to settle
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(canvasRef.current!, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#F4F4F2',
          logging: false,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.save(`${page.title || 'grammar-page'}.pdf`);
      } catch (error) {
        console.error('PDF Export Error:', error);
        alert('Errore tecnico durante la generazione del PDF. Controlla di non avere troppi elementi pesanti.');
      } finally {
        setExporting(false);
        if (!wasPreview) setIsPreview(false);
      }
    }, 1200);
  };

  const exportHTML = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <title>${page.title}</title>
        <style>
          body { font-family: sans-serif; background: #F4F4F2; color: #1A1A1A; padding: 40px; }
          .container { max-width: 900px; margin: 0 auto; }
          h1 { text-transform: uppercase; letter-spacing: -2px; font-size: 3rem; margin-bottom: 10px; }
          p.desc { color: #666; font-size: 1.2rem; margin-bottom: 40px; }
          .grid { display: grid; grid-template-columns: ${page.layout === 'double' ? '1fr 1fr' : '1fr'}; gap: 20px; }
          .card { background: white; border: 2px solid #1A1A1A; padding: 20px; position: relative; }
          .label { background: #1A1A1A; color: white; display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; }
          .example { border-left: 4px solid #1A1A1A; padding-left: 15px; font-style: italic; font-weight: bold; }
          .sticker { background: #FFD54F; padding: 20px; border: 2px solid #1A1A1A; font-family: monospace; }
          .vignette { display: flex; flex-direction: column; gap: 10px; }
          .bubble { padding: 10px; border: 2px solid #1A1A1A; border-radius: 15px; font-weight: 500; }
          .speaker { font-weight: 900; font-size: 10px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; border: 2px solid #1A1A1A; }
          th, td { border: 1px solid #1A1A1A; padding: 10px; text-align: left; }
          th { background: #F0F0F0; font-size: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${page.title}</h1>
          <p class="desc">${page.description}</p>
          <div class="grid">
            ${page.elements.map(el => `
              <div class="card">
                <div class="label">${el.type.replace('-', ' ')}</div>
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

  const renderElementHTML = (el: GrammarElement) => {
    switch(el.type) {
      case 'text-box': return `<p>${el.content}</p>`;
      case 'example-single': return `<div class="example">${el.content}</div>`;
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
            <div><span class="speaker">${v.speaker1}</span><div class="bubble" style="background: #D1E9FF">${v.text1}</div></div>
            <div style="text-align: right;"><span class="speaker">${v.speaker2}</span><div class="bubble" style="background: #D4EDDA">${v.text2}</div></div>
          </div>
        `;
      case 'list':
        const l = el.content as ListData;
        return `<ul>${l.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
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
          <div className="bg-[#EBEBE9] border-2 border-border p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-black mb-4">Elementi</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {tools.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => addElement(tool.type as ElementType)}
                  className="flex items-center gap-3 w-full p-2 border border-border bg-white hover:bg-zinc-100 transition-all text-ink group shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] active:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0"
                >
                  <div className="w-7 h-7 flex items-center justify-center text-ink/40 group-hover:text-ink">
                    <tool.icon size={14} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-tight">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#EBEBE9] border-2 border-border p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-black mb-4">Configurazione</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setPage(p => ({ ...p, layout: p.layout === 'single' ? 'double' : 'single' }))}
                className="flex items-center gap-3 w-full p-2 border border-border bg-white hover:bg-zinc-100 transition-all font-black uppercase text-[10px] active:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0"
              >
                {page.layout === 'double' ? <Columns size={14} /> : <Square size={14} />}
                {page.layout === 'double' ? 'Griglia 2 Col' : 'Lista Singola'}
              </button>
               <button 
                onClick={() => setPage(p => ({ ...p, isPublic: !p.isPublic }))}
                className="flex items-center gap-3 w-full p-2 border border-border bg-white hover:bg-zinc-100 transition-all font-black uppercase text-[10px] active:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0"
              >
                <Share2 size={14} className={page.isPublic ? 'text-accent-blue' : ''} />
                {page.isPublic ? 'Pubblico' : 'Privato'}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Main Canvas Area */}
      <div className="flex-grow w-full space-y-8">
        {/* Editor Toolbar */}
        <div className="bg-white border-2 border-border p-4 flex items-center justify-between shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] no-print">
          <div className="flex items-center gap-4 flex-grow max-w-md">
            <input 
              value={page.title}
              onChange={(e) => setPage(p => ({ ...p, title: e.target.value }))}
              readOnly={isPreview}
              className={`text-2xl font-black uppercase tracking-tighter bg-transparent border-none focus:ring-0 p-0 w-full ${isPreview ? 'cursor-default' : ''}`}
              placeholder="Titolo lezione..."
            />
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <button 
              onClick={() => setIsPreview(!isPreview)}
              disabled={exporting}
              className={`p-2 border-2 border-border transition-all flex items-center gap-2 font-black uppercase text-[10px] ${isPreview ? 'bg-accent-yellow' : 'bg-white hover:bg-stone-50'} ${exporting ? 'opacity-50' : ''}`}
              title={isPreview ? "Torna all'Editor" : "Anteprima Finale"}
            >
              <Eye size={14} /> <span className="hidden md:inline">{isPreview ? 'Edit' : 'Anteprima'}</span>
            </button>

            <div className="flex items-center gap-2 border-l-2 border-border/10 pl-3">
              <button 
                onClick={exportPDF} 
                disabled={exporting}
                className="p-2 border-2 border-border bg-white hover:bg-stone-50 transition-all flex items-center gap-2 font-black uppercase text-[10px] disabled:opacity-50"
                title="Scarica PDF"
              >
                <Download size={14} className={exporting ? 'animate-bounce' : ''} /> 
                <span className="hidden md:inline">{exporting ? 'Generazione...' : 'PDF'}</span>
              </button>
              <button 
                onClick={exportHTML} 
                className="p-2 border-2 border-border bg-white hover:bg-stone-50 transition-all flex items-center gap-2 font-black uppercase text-[10px]"
                title="Scarica HTML"
              >
                <FileCode size={14} /> <span className="hidden md:inline">HTML</span>
              </button>
            </div>

            <div className="flex items-center gap-3 border-l-2 border-border/10 pl-3">
              {saveStatus !== 'idle' && (
                <span className="text-[9px] uppercase font-black text-ink/40 mr-1 flex items-center gap-1">
                  {saveStatus === 'saving' && 'Sync...'}
                  {saveStatus === 'success' && <><Check size={10} className="text-green-600" /> Ok</>}
                </span>
              )}
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-ink text-white px-5 py-2 border-2 border-border font-black text-[10px] uppercase hover:bg-zinc-800 disabled:opacity-50 transition-all"
              >
                Salva
              </button>
              <button 
                onClick={onClose}
                className="p-1 text-ink/40 hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* The Page - Bento Canvas */}
        <div 
          ref={canvasRef}
          className={`bg-[#FDFDFC] border-2 border-border p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] bg-dots min-h-[90vh] transition-all ${isPreview ? 'shadow-none md:p-16' : ''}`}
        >
          <div className="max-w-4xl mx-auto space-y-12">
            <header className="space-y-4 text-center pb-10 border-b-2 border-border/10">
               <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85]">{page.title}</h1>
               {isPreview ? (
                 <p className="w-full text-center font-medium text-ink/60 text-lg">{page.description}</p>
               ) : (
                 <textarea 
                  value={page.description}
                  onChange={(e) => setPage(p => ({ ...p, description: e.target.value }))}
                  className="w-full text-center bg-transparent border-none focus:ring-0 font-medium text-ink/60 text-lg resize-none min-h-[3rem]"
                  placeholder="Aggiungi descrizione..."
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
