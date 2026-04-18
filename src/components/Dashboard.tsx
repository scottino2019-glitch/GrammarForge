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
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-16 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-accent-cyan/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-accent-pink/10 rounded-full blur-3xl -z-10 animate-bounce transition-all"></div>

        <motion.div
           initial={{ rotate: -2, scale: 0.9 }}
           animate={{ rotate: 1, scale: 1 }}
           className="inline-block"
        >
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-ink leading-[0.8] uppercase flex flex-col items-center">
            <span className="bg-white px-6 border-4 border-ink shadow-hard -rotate-2">Grammar</span>
            <span className="bg-accent-yellow px-6 border-4 border-ink shadow-hard rotate-1 -mt-2 md:-mt-4 relative z-10 text-ink">Forge</span>
            <span className="text-3xl md:text-4xl mt-6 font-mono font-black bg-ink text-white px-4 py-1 skew-x-12 tracking-widest">STUDIO 1.0</span>
          </h1>
        </motion.div>
        
        <p className="mt-12 text-ink/80 max-w-2xl mx-auto text-xl font-black uppercase tracking-tight leading-none italic">
          <span className="bg-accent-cyan px-2 italic">Laboratorio Creativo</span> per la Grammatica. <br/>
          Progetta layout <span className="underline decoration-accent-pink decoration-4 underline-offset-4">esplosivi</span> e condividili.
        </p>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Creations */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-4 border-ink pb-4">
            <h2 className="font-black uppercase text-sm tracking-widest flex items-center gap-2 bg-accent-lime px-3 py-1 border-3 border-ink shadow-hard-sm">
              <FileText className="text-ink" size={20} strokeWidth={3} /> I miei progetti
            </h2>
            <span className="text-xs font-black uppercase tracking-widest bg-ink text-white px-2 py-1 rotate-12">{myCreations.length}</span>
          </div>

          {!user ? (
            <div className="bg-white border-2 border-border p-12 text-center">
              <p className="text-ink/40 text-sm font-bold uppercase tracking-widest">Accedi per creare</p>
            </div>
          ) : myCreations.length === 0 ? (
            <div className="bg-white border-2 border-border p-12 text-center space-y-4">
              <p className="text-ink/40 text-sm font-bold uppercase tracking-widest">Nessun progetto trovato</p>
              <button 
                onClick={onCreate}
                className="bg-ink text-white px-6 py-2 border-2 border-border font-bold text-xs uppercase hover:bg-zinc-800 flex items-center gap-2 mx-auto"
              >
                Crea il primo <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
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
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-4 border-ink pb-4">
            <h2 className="font-black uppercase text-sm tracking-widest flex items-center gap-2 bg-accent-cyan px-3 py-1 border-3 border-ink shadow-hard-sm">
              <Globe className="text-ink" size={20} strokeWidth={3} /> Community
            </h2>
            <span className="text-xs font-black uppercase tracking-widest bg-ink text-zinc-100 px-2 py-1 -rotate-12">{publicCreations.length}</span>
          </div>

          {publicCreations.length === 0 ? (
            <div className="p-12 text-center text-ink/40 text-sm font-bold uppercase tracking-widest">
              Ancora nulla da mostrare
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
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
      whileHover={{ y: -4, x: -4 }}
      className="bg-white group border-3 border-ink p-6 hover:bg-accent-yellow transition-all flex items-start gap-4 shadow-hard hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
    >
      <div 
        onClick={onClick}
        className="w-12 h-12 bg-ink flex-shrink-0 flex items-center justify-center text-white cursor-pointer rotate-2 group-hover:rotate-0 transition-transform"
      >
        <FileText size={24} />
      </div>
      <div className="flex-grow min-w-0 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-black uppercase text-sm tracking-tight text-ink truncate">{page.title}</h3>
          {page.isPublic && <Globe size={10} className="text-accent-orange" />}
        </div>
        <p className="text-[12px] font-bold text-ink/60 line-clamp-1 mt-1 lowercase leading-tight">{page.description || 'senza descrizione'}</p>
        <div className="flex items-center gap-4 mt-4 text-[10px] font-black uppercase tracking-widest text-ink/40">
          <span className="flex items-center gap-1.5 shrink-0 bg-ink text-zinc-100 px-2 py-0.5 -rotate-1">
            <UserIcon size={10} strokeWidth={3} /> {page.authorName}
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap bg-white border-2 border-ink px-2 py-0.5 rotate-1">
            <Clock size={10} strokeWidth={3} /> {page.updatedAt?.toDate?.()?.toLocaleDateString('it-IT') || 'adesso'}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {showDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-2 bg-white border-2 border-ink text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-hard-sm"
          >
            <Trash2 size={16} strokeWidth={3} />
          </button>
        )}
        <button onClick={onClick} className="p-2 bg-ink text-white border-2 border-ink hover:bg-accent-cyan hover:text-ink transition-all shadow-hard-sm">
          <ArrowRight size={18} strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  );
}
