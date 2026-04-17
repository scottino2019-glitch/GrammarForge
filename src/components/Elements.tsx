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
            <div className="bento-label">Testo</div>
            <textarea
              value={element.content}
              onChange={(e) => onUpdate(element.id, e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 p-0 text-ink leading-relaxed resize-none min-h-[4rem] font-medium"
              placeholder="Scrivi qui il tuo testo..."
            />
          </>
        );

      case 'example-single':
        return (
          <>
            <div className="bento-label">Esempio</div>
            <div className="bg-[#FAFAFA] border-l-4 border-border p-4">
              <input
                value={element.content}
                onChange={(e) => onUpdate(element.id, e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 font-bold italic text-ink"
                placeholder="Esempio singolo..."
              />
            </div>
          </>
        );

      case 'example-multi':
        const examples = Array.isArray(element.content) ? element.content : [''];
        return (
          <>
            <div className="bento-label">Esempi</div>
            <div className="space-y-3">
              {examples.map((ex, idx) => (
                <div key={idx} className="flex items-center gap-3 group/ex">
                  <span className="text-[10px] font-black uppercase text-ink/20">Ex {idx + 1}</span>
                  <input
                    value={ex}
                    onChange={(e) => {
                      const newEx = [...examples];
                      newEx[idx] = e.target.value;
                      onUpdate(element.id, newEx);
                    }}
                    className="flex-grow bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-ink"
                    placeholder="Aggiungi esempio..."
                  />
                  {idx === examples.length - 1 && ex && (
                    <button 
                      onClick={() => onUpdate(element.id, [...examples, ''])}
                      className="w-5 h-5 border border-border flex items-center justify-center text-[10px] bg-white hover:bg-zinc-50 font-black"
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
            <div className="bento-label">Dialogo</div>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1 items-start">
                <input 
                  placeholder="A" 
                  value={vig.speaker1}
                  onChange={(e) => onUpdate(element.id, { ...vig, speaker1: e.target.value })}
                  className="font-black text-[9px] uppercase bg-ink text-white px-2 py-0.5"
                />
                <div className="bubble bubble-left bg-accent-blue border-2 border-border p-3 rounded-2xl flex-grow font-medium w-full">
                  <textarea 
                    value={vig.text1}
                    onChange={(e) => onUpdate(element.id, { ...vig, text1: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm resize-none"
                    placeholder="Ciao..."
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end text-right">
                <input 
                  placeholder="B" 
                  value={vig.speaker2}
                  onChange={(e) => onUpdate(element.id, { ...vig, speaker2: e.target.value })}
                  className="font-black text-[9px] uppercase bg-ink text-white px-2 py-0.5"
                />
                <div className="bubble bubble-right bg-accent-green border-2 border-border p-3 rounded-2xl flex-grow font-medium w-full">
                  <textarea 
                    value={vig.text2}
                    onChange={(e) => onUpdate(element.id, { ...vig, text2: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm resize-none"
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
            <div className="bento-label">Nota</div>
            <div className="bg-accent-yellow p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] border-2 border-border">
              <textarea
                value={element.content}
                onChange={(e) => onUpdate(element.id, e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-ink font-mono text-xs leading-relaxed h-24 resize-none placeholder:text-ink/40"
                placeholder="RICORDA!..."
              />
            </div>
          </>
        );

      case 'note':
        return (
          <>
            <div className="bento-label">Approfondimento</div>
            <div className="bg-[#EEE] p-5 border border-border/20">
              <textarea
                value={element.content}
                onChange={(e) => onUpdate(element.id, e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-ink/70 text-sm font-medium h-24 resize-none leading-relaxed"
                placeholder="Dettagli aggiuntivi..."
              />
            </div>
          </>
        );

      case 'list':
        const list = element.content as ListData;
        return (
          <>
            <div className="bento-label">Lista</div>
            <div className="space-y-2">
              {list.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-5 h-5 border border-border bg-zinc-50 flex items-center justify-center text-[10px] font-black">
                    {list.style === 'bullet' ? '•' : idx + 1}
                  </span>
                  <input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...list.items];
                      newItems[idx] = e.target.value;
                      onUpdate(element.id, { ...list, items: newItems });
                    }}
                    className="flex-grow bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-ink"
                    placeholder="Aggiungi item..."
                  />
                  {idx === list.items.length - 1 && item && (
                    <button 
                      onClick={() => onUpdate(element.id, { ...list, items: [...list.items, ''] })}
                      className="text-stone-300 hover:text-ink"
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
            <div className="bento-label">Tabella</div>
            <div className="overflow-x-auto pt-2">
              <table className="w-full border-collapse border-2 border-border">
                <thead>
                  <tr>
                    {table.headers.map((h, i) => (
                      <th key={i} className="border border-border p-2 bg-[#F0F0F0]">
                        <input 
                          value={h} 
                          onChange={(e) => {
                            const newH = [...table.headers];
                            newH[i] = e.target.value;
                            onUpdate(element.id, { ...table, headers: newH });
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-center font-black text-[10px] uppercase tracking-widest overflow-hidden"
                        />
                      </th>
                    ))}
                    <th className="w-8 border border-border">
                      <button onClick={() => {
                          const newH = [...table.headers, '?'];
                          const newRows = table.rows.map(r => [...r, '']);
                          onUpdate(element.id, { ...table, headers: newH, rows: newRows });
                      }} className="text-ink/20">+</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="border border-border p-2">
                          <input 
                            value={cell}
                            onChange={(e) => {
                              const newRows = [...table.rows];
                              newRows[ri][ci] = e.target.value;
                              onUpdate(element.id, { ...table, rows: newRows });
                            }}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium"
                          />
                        </td>
                      ))}
                      <td className="border border-border"></td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={table.headers.length + 1} className="text-center p-1 border border-border">
                        <button onClick={() => {
                          const newRows = [...table.rows, Array(table.headers.length).fill('')];
                          onUpdate(element.id, { ...table, rows: newRows });
                        }} className="text-ink/20 text-xs">+</button>
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
