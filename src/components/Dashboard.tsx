import { useState, useEffect, FC } from 'react';
import { db, collection, query, where, onSnapshot, orderBy, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { User } from 'firebase/auth';
import { GrammarPage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Globe, Clock, User as UserIcon, ArrowRight, Trash2, AlertCircle } from 'lucide-react';

interface DashboardProps {
  user: User | null;
  publicCreations: GrammarPage[];
  onOpen: (page: GrammarPage) => void;
  onCreate: () => void;
}

export default function Dashboard({ user, publicCreations, onOpen, onCreate }: DashboardProps) {
  const [myCreations, setMyCreations] = useState<GrammarPage[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMyCreations([]);
      return;
    }
    const q = query(
      collection(db, "creations"), 
      where("authorId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyCreations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GrammarPage)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "creations");
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "creations", id));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `creations/${id}`);
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-red"
            >
              Creative Laboratory
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-7xl md:text-9xl font-black tracking-tighter text-ink leading-[0.8] uppercase"
            >
              Grammar<br />Forge <span className="text-transparent" style={{ WebkitTextStroke: '2px #1A1A1A' }}>Studio</span>
            </motion.h1>
          </div>
          
          <div className="max-w-xs text-ink/60 text-sm font-medium leading-relaxed border-l-2 border-border/10 pl-6 pb-2">
            Progetta layout bento eleganti per le tue lezioni. 
            Uno strumento professionale per educatori digitali.
          </div>
        </div>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* User Creations */}
        <section className="xl:col-span-12 space-y-8">
          <div className="flex items-center justify-between border-b-2 border-border pb-6">
            <div className="flex items-baseline gap-4">
              <h2 className="font-black uppercase text-2xl tracking-tighter flex items-center gap-3">
                <FileText className="text-ink" size={24} /> I miei progetti
              </h2>
              <span className="text-[11px] font-black uppercase tracking-widest text-ink/20">{myCreations.length} totali</span>
            </div>
            {user && myCreations.length > 0 && (
              <button 
                onClick={onCreate}
                className="bg-ink text-white px-6 py-2 border-2 border-border font-bold text-[10px] uppercase hover:bg-zinc-800 flex items-center gap-2"
              >
                Nuovo Progetto <Plus size={14} />
              </button>
            )}
          </div>

          {!user ? (
            <div className="bg-white border-2 border-border p-20 text-center shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
              <p className="text-ink/40 text-xs font-black uppercase tracking-[0.2em]">Accedi per iniziare a creare</p>
            </div>
          ) : myCreations.length === 0 ? (
            <div className="bg-white border-2 border-border p-20 text-center space-y-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
              <p className="text-ink/30 text-xs font-black uppercase tracking-[0.2em]">Il tuo archivio è ancora vuoto</p>
              <button 
                onClick={onCreate}
                className="bg-accent-yellow text-ink px-8 py-3 border-2 border-border font-black text-xs uppercase hover:bg-yellow-400 flex items-center gap-2 mx-auto shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0"
              >
                Inizia ora <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCreations.map((page) => (
                <CreationCard 
                  key={page.id} 
                  page={page} 
                  onClick={() => onOpen(page)} 
                  onDelete={() => setDeletingId(page.id!)}
                  showDelete
                />
              ))}
            </div>
          )}
        </section>

        {/* Community */}
        <section className="xl:col-span-12 space-y-8 pt-12 border-t-2 border-border/5">
          <div className="flex items-baseline gap-4 border-b-2 border-border/10 pb-6">
            <h2 className="font-black uppercase text-2xl tracking-tighter flex items-center gap-3">
              <Globe className="text-ink/40" size={24} /> Community Feed
            </h2>
            <span className="text-[11px] font-black uppercase tracking-widest text-ink/20">{publicCreations.length} bento condivisi</span>
          </div>

          {publicCreations.length === 0 ? (
            <div className="p-20 text-center text-ink/20 text-xs font-black uppercase tracking-[0.2em] border-2 border-dashed border-border/10">
              In attesa di nuove ispirazioni
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {publicCreations.map((page) => (
                <CreationCard key={page.id} page={page} onClick={() => onOpen(page)} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-border p-8 max-w-sm w-full shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <AlertCircle size={32} />
                </div>
                <h3 className="font-black uppercase text-xl tracking-tight">Elimina Progetto?</h3>
                <p className="text-ink/60 text-sm font-medium">Questa azione è irreversibile. Sei sicuro di volerlo eliminare?</p>
                <div className="flex gap-4 w-full pt-4">
                  <button 
                    onClick={() => setDeletingId(null)}
                    className="flex-1 px-4 py-3 border-2 border-border font-black uppercase text-[10px] hover:bg-stone-50"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={() => handleDelete(deletingId)}
                    className="flex-1 px-4 py-3 bg-red-600 text-white border-2 border-border font-black uppercase text-[10px] hover:bg-red-700"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CreationCardProps {
  page: GrammarPage;
  onClick: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

const CreationCard: FC<CreationCardProps> = ({ 
  page, 
  onClick, 
  onDelete,
  showDelete = false
}) => {
  return (
    <motion.div 
      whileHover={{ y: -4, shadow: 'none' }}
      className="bg-white group border-2 border-border p-6 hover:bg-bg transition-all flex flex-col gap-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0"
    >
      <div className="flex justify-between items-start">
        <div 
          onClick={onClick}
          className="w-12 h-12 bg-ink flex-shrink-0 flex items-center justify-center text-white cursor-pointer shadow-[3px_3px_0px_0px_rgba(255,213,79,1)]"
        >
          <FileText size={24} />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="p-2 text-ink/20 hover:text-red-500 transition-colors"
              title="Elimina"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button 
            onClick={onClick}
            className="p-2 text-ink/20 hover:text-ink transition-colors"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-2 cursor-pointer" onClick={onClick}>
        <h3 className="font-black uppercase text-sm tracking-tight text-ink leading-tight">{page.title}</h3>
        <p className="text-[11px] font-medium text-ink/50 line-clamp-2 min-h-[2.5rem] leading-relaxed italic">{page.description || 'Nessuna descrizione fornita per questo bento-progetto.'}</p>
      </div>

      <div className="pt-4 border-t border-border/10 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-stone-100 rounded-full flex items-center justify-center border border-border/10">
            <UserIcon size={10} className="text-ink/30" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-ink/40">{page.authorName}</span>
        </div>
        <span className="text-[8px] font-bold text-ink/20 flex items-center gap-1 uppercase">
          <Clock size={8} /> {page.updatedAt?.toDate?.()?.toLocaleDateString() || 'Nuovo'}
        </span>
      </div>
    </motion.div>
  );
}
