import { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  db,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  handleFirestoreError,
  OperationType
} from './firebase';
import { User } from 'firebase/auth';
import { GrammarPage } from './types';
import Editor from './components/Editor';
import Dashboard from './components/Dashboard';
import { LogIn, LogOut, BookOpen, Plus, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<GrammarPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [publicCreations, setPublicCreations] = useState<GrammarPage[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "creations"), 
      where("isPublic", "==", true),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GrammarPage));
      setPublicCreations(docs);
    }, (error) => {
      console.error("Public fetch error", error);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => signOut(auth);

  const startNew = () => {
    if (!user) return handleLogin();
    setCurrentPage({
      title: 'Nuova Lezione',
      description: '',
      layout: 'single',
      elements: [],
      authorId: user.uid,
      authorName: user.displayName || 'Anonimo',
      isPublic: false
    });
    setIsEditing(true);
  };

  const openPage = (page: GrammarPage) => {
    setCurrentPage(page);
    setIsEditing(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-stone-400 font-serif italic"
        >
          Caricamento...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink font-sans selection:bg-accent-yellow">
      {/* Header */}
      <nav className="border-b-4 border-ink bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsEditing(false)}>
            <div className="bg-accent-pink p-1 border-3 border-ink shadow-hard-sm group-hover:rotate-12 transition-transform">
               <BookOpen size={24} strokeWidth={3} className="text-white" />
            </div>
            <div className="font-black text-2xl tracking-tighter uppercase leading-none">
              GrammarForge <span className="text-accent-pink">STUDIO</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={startNew}
                  className="flex items-center gap-2 bg-accent-lime text-ink px-6 py-2.5 border-3 border-ink font-black text-xs uppercase hover:bg-lime-400 transition-all shadow-hard-sm active:shadow-none"
                >
                  <Plus size={16} strokeWidth={3} /> Nuovo
                </button>
                <div className="flex items-center gap-2 group cursor-pointer relative">
                  <img src={user.photoURL || ''} alt="" className="w-10 h-10 border-3 border-ink rounded-full shadow-hard-sm hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                  <div className="hidden group-hover:block absolute right-0 top-full pt-4">
                    <button 
                      onClick={handleLogout}
                      className="bg-white border-3 border-ink shadow-hard p-4 py-3 text-[11px] font-black uppercase flex items-center gap-3 hover:bg-accent-pink hover:text-white transition-all whitespace-nowrap -rotate-2"
                    >
                      <LogOut size={14} strokeWidth={3} /> Esci
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-3 border-3 border-ink bg-white px-6 py-2.5 font-black text-xs uppercase hover:bg-accent-cyan transition-all shadow-hard-sm active:shadow-none"
              >
                <LogIn size={16} strokeWidth={3} /> Accedi
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {isEditing && currentPage ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Editor 
                page={currentPage} 
                user={user} 
                onClose={() => setIsEditing(false)} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Dashboard 
                user={user} 
                publicCreations={publicCreations}
                onOpen={openPage}
                onCreate={startNew}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Footer Meta */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t-2 border-border mt-12 flex justify-between items-center text-stone-500 text-[10px] font-black uppercase tracking-widest">
        <div>© 2026 GrammarForge Studio</div>
        <div className="flex gap-6">
          <span>Stato: {user ? 'Connesso' : 'Ospite'}</span>
          <span>Build v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
