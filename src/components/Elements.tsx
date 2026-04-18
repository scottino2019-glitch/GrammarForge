import { Trash2, GripVertical, Type, List as ListIcon, Table as TableIcon, StickyNote, MessageSquare, Quote, Layers, Check } from 'lucide-react';
import { GrammarElement, VignetteData, TableData, ListData } from '../types';

interface ElementProps {
  element: GrammarElement;
  onUpdate: (id: string, content: any) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  key?: string;
}

export function ElementRenderer({ element, onUpdate, onRemove, isEditing }: ElementProps) {
  const renderContent = () => {
    switch (element.type) {
      case 'text-box':
        return (
          <>
            <div className="bento-label bg-accent-cyan text-ink border-2 border-ink">Testo</div>
            <textarea
              value={element.content}
              onChange={(e) => onUpdate(element.id, e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 p-0 text-ink leading-relaxed resize-none min-h-[4rem] font-black"
              placeholder="Scrivi qui il tuo testo..."
            />
          </>
        );

      case 'example-single':
        return (
          <>
            <div className="bento-label bg-accent-yellow text-ink border-2 border-ink">Esempio</div>
            <div className="bg-accent-yellow/10 border-l-8 border-ink p-4 shadow-hard-sm">
              <input
                value={element.content}
                onChange={(e) => onUpdate(element.id, e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 font-black italic text-ink text-lg"
                placeholder="Esempio singolo..."
              />
            </div>
          </>
        );

      case 'example-multi':
        const examples = Array.isArray(element.content) ? element.content : [''];
        return (
          <>
            <div className="bento-label bg-accent-orange text-white border-2 border-ink">Esempi</div>
            <div className="space-y-4">
              {examples.map((ex, idx) => (
                <div key={idx} className="flex items-center gap-4 group/ex">
                  <span className="text-[12px] font-black bg-ink text-white w-8 h-8 flex items-center justify-center rotate-3">{idx + 1}</span>
                  <input
                    value={ex}
                    onChange={(e) => {
                      const newEx = [...examples];
                      newEx[idx] = e.target.value;
                      onUpdate(element.id, newEx);
                    }}
                    className="flex-grow bg-white border-3 border-ink p-2 shadow-hard-sm focus:ring-0 focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none transition-all font-bold text-ink"
                    placeholder="Aggiungi esempio..."
                  />
                  {idx === examples.length - 1 && ex && (
                    <button 
                      onClick={() => onUpdate(element.id, [...examples, ''])}
                      className="w-8 h-8 border-3 border-ink flex items-center justify-center text-lg bg-accent-cyan hover:bg-cyan-400 font-black shadow-hard-sm"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        );

      case 'vignette':
        const vig = element.content as VignetteData;
        return (
          <>
            <div className="bento-label bg-accent-pink text-white border-2 border-ink">Dialogo</div>
            <div className="space-y-6 pt-4">
              <div className="flex flex-col gap-2 items-start">
                <input 
                  placeholder="A" 
                  value={vig.speaker1}
                  onChange={(e) => onUpdate(element.id, { ...vig, speaker1: e.target.value })}
                  className="font-black text-[11px] uppercase bg-ink text-white px-3 py-1 border-2 border-ink shadow-hard-sm -rotate-2"
                />
                <div className="bubble bubble-left bg-accent-cyan border-3 border-ink p-4 shadow-hard font-black w-full">
                  <textarea 
                    value={vig.text1}
                    onChange={(e) => onUpdate(element.id, { ...vig, text1: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm resize-none placeholder:text-ink/30"
                    placeholder="Ciao..."
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end text-right">
                <input 
                  placeholder="B" 
                  value={vig.speaker2}
                  onChange={(e) => onUpdate(element.id, { ...vig, speaker2: e.target.value })}
                  className="font-black text-[11px] uppercase bg-white text-ink px-3 py-1 border-2 border-ink shadow-hard-sm rotate-2"
                />
                <div className="bubble bubble-right bg-accent-pink border-3 border-ink p-4 shadow-hard font-black w-full text-white">
                  <textarea 
                    value={vig.text2}
                    onChange={(e) => onUpdate(element.id, { ...vig, text2: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm resize-none placeholder:text-white/50"
                    placeholder="Ehi..."
                  />
                </div>
              </div>
            </div>
          </>
        );

      case 'sticker':
        return (
          <>
            <div className="bento-label bg-accent-lime text-ink border-2 border-ink">Nota</div>
            <div className="bg-accent-lime p-6 shadow-hard border-3 border-ink -rotate-1">
              <textarea
                value={element.content}
                onChange={(e) => onUpdate(element.id, e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-ink font-mono text-sm leading-relaxed h-28 resize-none placeholder:text-ink/40 font-black"
                placeholder="RICORDA!..."
              />
            </div>
          </>
        );

      case 'note':
        return (
          <>
            <div className="bento-label bg-accent-cyan text-ink border-2 border-ink">Approfondimento</div>
            <div className="bg-white p-6 border-3 border-ink shadow-hard">
              <textarea
                value={element.content}
                onChange={(e) => onUpdate(element.id, e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-ink text-sm font-bold h-28 resize-none leading-relaxed"
                placeholder="Dettagli aggiuntivi..."
              />
            </div>
          </>
        );

      case 'list':
        const list = element.content as ListData;
        return (
          <>
            <div className="bento-label bg-accent-orange text-white border-2 border-ink">Lista</div>
            <div className="space-y-3">
              {list.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="w-8 h-8 border-3 border-ink bg-accent-yellow flex items-center justify-center text-sm font-black shadow-hard-sm">
                    {list.style === 'bullet' ? '★' : idx + 1}
                  </span>
                  <input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...list.items];
                      newItems[idx] = e.target.value;
                      onUpdate(element.id, { ...list, items: newItems });
                    }}
                    className="flex-grow bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-ink border-b-3 border-dotted border-ink/20 focus:border-ink"
                    placeholder="Aggiungi item..."
                  />
                  {idx === list.items.length - 1 && item && (
                    <button 
                      onClick={() => onUpdate(element.id, { ...list, items: [...list.items, ''] })}
                      className="w-8 h-8 bg-accent-lime border-3 border-ink font-black shadow-hard-sm"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        );

      case 'table':
        const table = element.content as TableData;
        return (
          <>
            <div className="bento-label bg-accent-cyan text-ink border-2 border-ink">Tabella</div>
            <div className="overflow-x-auto pt-4">
              <table className="w-full border-collapse border-4 border-ink shadow-hard">
                <thead>
                  <tr>
                    {table.headers.map((h, i) => (
                      <th key={i} className="border-3 border-ink p-3 bg-accent-cyan">
                        <input 
                          value={h} 
                          onChange={(e) => {
                            const newH = [...table.headers];
                            newH[i] = e.target.value;
                            onUpdate(element.id, { ...table, headers: newH });
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-center font-black text-xs uppercase tracking-widest"
                        />
                      </th>
                    ))}
                    <th className="w-10 border-3 border-ink bg-ink text-white">
                      <button onClick={() => {
                          const newH = [...table.headers, '?'];
                          const newRows = table.rows.map(r => [...r, '']);
                          onUpdate(element.id, { ...table, headers: newH, rows: newRows });
                      }} className="w-full h-full font-black">+</button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {table.rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-accent-yellow/5">
                      {row.map((cell, ci) => (
                        <td key={ci} className="border-3 border-ink p-3">
                          <input 
                            value={cell}
                            onChange={(e) => {
                              const newRows = [...table.rows];
                              newRows[ri][ci] = e.target.value;
                              onUpdate(element.id, { ...table, rows: newRows });
                            }}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold"
                          />
                        </td>
                      ))}
                      <td className="border-3 border-ink text-center">
                         <button 
                           onClick={() => {
                             const newRows = table.rows.filter((_, i) => i !== ri);
                             onUpdate(element.id, { ...table, rows: newRows });
                           }}
                           className="text-ink/20 hover:text-red-500 font-black"
                         >
                           ×
                         </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={table.headers.length + 1} className="text-center p-2 border-3 border-ink bg-zinc-50">
                        <button onClick={() => {
                          const newRows = [...table.rows, Array(table.headers.length).fill('')];
                          onUpdate(element.id, { ...table, rows: newRows });
                        }} className="font-black text-ink uppercase text-[10px] tracking-widest">+ Aggiungi Riga</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="group bento-card hover:bg-zinc-50 transition-colors">
      {isEditing && (
        <div className="absolute -left-12 top-0 bottom-0 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-4">
          <div className="cursor-grab p-1 text-ink/20 hover:text-ink">
            <GripVertical size={20} />
          </div>
          <button 
            onClick={() => onRemove(element.id)}
            className="p-1 text-ink/20 hover:text-red-500"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
      {renderContent()}
    </div>
  );
}
