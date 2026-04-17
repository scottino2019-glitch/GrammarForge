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
    <div className="min-h-screen bg-bg text-ink font-sans selection:bg-accent-yellow flex">
      {/* Sidebar Navigation */}
      <aside className="w-[var(--sidebar-width)] h-screen border-r-2 border-border bg-[#EBEBE9] sticky top-0 flex flex-col no-print hidden lg:flex shrink-0">
        <div className="p-8 border-b-2 border-border mb-8">
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => setIsEditing(false)}
          >
            <div className="font-black text-2xl tracking-tighter uppercase leading-none">
              Grammar<br />Forge
            </div>
            <div className="bg-ink text-white text-[8px] px-1 py-0.5 font-black uppercase self-end mb-1">PRO</div>
          </div>
        </div>

        <nav className="flex-grow px-4 space-y-2">
          <button 
            onClick={() => setIsEditing(false)}
            className={`sidebar-link w-full ${!isEditing ? 'sidebar-link-active' : ''}`}
          >
            <BookOpen size={16} /> Dashboard
          </button>
          
          <div className="pt-4 pb-2 px-4">
            <h3 className="text-[9px] uppercase font-black text-ink/30 tracking-[0.2em]">Azioni</h3>
          </div>
          
          <button 
            onClick={startNew}
            className="sidebar-link w-full"
          >
            <Plus size={16} /> Nuova Lezione
          </button>
        </nav>

        <div className="p-4 mt-auto border-t-2 border-border">
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 p-3 bg-white border-2 border-border shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 border border-border" referrerPolicy="no-referrer" />
                <div className="min-w-0">
                  <div className="text-[9px] font-black uppercase truncate">{user.displayName}</div>
                  <div className="text-[8px] text-ink/40 font-bold truncate">Premium User</div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full sidebar-link"
              >
                <LogOut size={14} /> Esci
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="bg-ink text-white w-full py-4 border-2 border-border font-black text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0"
            >
              Accedi con Google
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <nav className="lg:hidden border-b-2 border-border bg-white sticky top-0 z-50 px-4 h-16 flex items-center justify-between no-print shrink-0">
          <div className="font-black text-xl tracking-tighter uppercase" onClick={() => setIsEditing(false)}>
            GrammarForge
          </div>
          <button onClick={user ? startNew : handleLogin} className="p-2 border-2 border-border">
            {user ? <Plus size={20} /> : <LogIn size={20} />}
          </button>
        </nav>

        <main className="flex-grow">
          <AnimatePresence mode="wait">
            {isEditing && currentPage ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 md:p-8"
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 md:p-12 lg:p-16"
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
        <footer className="px-12 py-8 border-t-2 border-border/5 flex justify-between items-center text-stone-500 text-[9px] font-black uppercase tracking-widest no-print shrink-0">
          <div>© 2026 GrammarForge Studio</div>
          <div className="flex gap-6">
            <span>Server: OK</span>
            <span>Auth: {user ? 'Verified' : 'Guest'}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
