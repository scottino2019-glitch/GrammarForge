import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, orderBy } from '../firebase';
import { User } from 'firebase/auth';
import { GrammarPage } from '../types';
import { motion } from 'motion/react';
import { FileText, Globe, Clock, User as UserIcon, ArrowRight } from 'lucide-react';

interface DashboardProps {
  user: User | null;
  publicCreations: GrammarPage[];
  onOpen: (page: GrammarPage) => void;
  onCreate: () => void;
}

export default function Dashboard({ user, publicCreations, onOpen, onCreate }: DashboardProps) {
  const [myCreations, setMyCreations] = useState<GrammarPage[]>([]);

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
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-12">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-ink leading-[0.85] uppercase"
        >
          GrammarForge <br /> <span className="text-transparent" style={{ WebkitTextStroke: '2px #1A1A1A' }}>Studio</span>
        </motion.h1>
        <p className="mt-8 text-ink/60 max-w-xl mx-auto text-lg font-medium">
          Il tuo laboratorio creativo per la grammatica.
          Progetta bento-layout eleganti e condividili con il mondo.
        </p>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Creations */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-border pb-4">
            <h2 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
              <FileText className="text-ink" size={16} /> I miei progetti
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-ink/30">{myCreations.length}</span>
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
                <CreationCard key={page.id} page={page} onClick={() => onOpen(page)} />
              ))}
            </div>
          )}
        </section>

        {/* Community */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-border pb-4">
            <h2 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
              <Globe className="text-ink" size={16} /> Community
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-ink/30">{publicCreations.length}</span>
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
    </div>
  );
}

function CreationCard({ page, onClick }: { page: GrammarPage; onClick: () => void; key?: string }) {
  return (
    <motion.div 
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="bg-white group cursor-pointer border-2 border-border p-5 hover:bg-bg transition-all flex items-start gap-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0"
    >
      <div className="w-10 h-10 bg-ink flex-shrink-0 flex items-center justify-center text-white">
        <FileText size={20} />
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="font-black uppercase text-xs tracking-tight text-ink truncate">{page.title}</h3>
        <p className="text-[11px] font-medium text-ink/60 truncate mt-1 lowercase">{page.description || 'no description'}</p>
        <div className="flex items-center gap-4 mt-3 text-[9px] font-black uppercase tracking-widest text-ink/30">
          <span className="flex items-center gap-1 shrink-0">
            <UserIcon size={9} /> {page.authorName}
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Clock size={9} /> {page.updatedAt?.toDate?.()?.toLocaleDateString() || 'just now'}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <ArrowRight size={14} className="text-ink/20 group-hover:text-ink transition-colors" />
      </div>
    </motion.div>
  );
}
