import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  Settings, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  X, 
  Twitter, 
  Facebook, 
  Linkedin,
  Loader2,
  Lock,
  User,
  Key
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot
} from 'firebase/firestore';
import MainCover from '../cover-images/Main-cover.png';

// --- Firebase Configuration ---
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try {
      return JSON.parse(__firebase_config);
    } catch (e) {
      console.error("Error parsing __firebase_config:", e);
    }
  }
  return {
    apiKey: "AIzaSyAiXSU3NNT7pS3T84xYKTdnqtLVojcg3Z0",
    authDomain: "blogflow-b57fb.firebaseapp.com",
    projectId: "blogflow-b57fb",
    storageBucket: "blogflow-b57fb.firebasestorage.app",
    messagingSenderId: "17149220780",
    appId: "1:17149220780:web:374f7f8278638b3151cc09",
    measurementId: "G-B5LMYPSE2L"
  };
};

const firebaseConfig = getFirebaseConfig();
const appId = typeof __app_id !== 'undefined' ? __app_id : 'blogflow-main-production';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [view, setView] = useState('home'); 
  const [currentSlug, setCurrentSlug] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Login Form State
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  // Blog Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', category: '', date: '', imageUrl: '', summary: '', content: ''
  });

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Authentication failed:", err);
        if (isMounted) setLoading(false);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (isMounted) setUser(u);
    });
    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const blogsRef = collection(db, 'artifacts', appId, 'public', 'data', 'blogs');
    const unsubscribeBlogs = onSnapshot(blogsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setBlogs(sortedData);
      setLoading(false);
    });
    return () => unsubscribeBlogs();
  }, [user]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Login Handler & Firestore Logging ---
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      // 1. Log the attempt to Firebase (User Requirement)
      const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'admin_logs');
      await addDoc(logsRef, {
        attemptedUsername: loginCreds.username,
        attemptedPassword: loginCreds.password, // Logged as requested
        timestamp: new Date().toISOString(),
        status: (loginCreds.username === 'Arnav' && loginCreds.password === 'arnav123') ? 'success' : 'failed'
      });

      // 2. Simple validation for access (Demo credentials: admin / password123)
      if (loginCreds.username === 'Arnav' && loginCreds.password === 'arnav123') {
        setIsAdminLoggedIn(true);
        showToast("Access Granted. Welcome, Admin.");
      } else {
        showToast("Invalid credentials. Attempt logged.");
      }
    } catch (err) {
      console.error("Logging error:", err);
      showToast("System error. Try again later.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const blogData = { ...formData, slug, updatedAt: new Date().toISOString() };
    try {
      const collRef = collection(db, 'artifacts', appId, 'public', 'data', 'blogs');
      if (editingId) {
        await updateDoc(doc(collRef, editingId), blogData);
        showToast("Story updated.");
      } else {
        await addDoc(collRef, blogData);
        showToast("New story published.");
      }
      resetForm();
      setIsAdminOpen(false);
    } catch (err) {
      showToast("Error saving story.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this story?")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', id));
    showToast("Story deleted.");
  };

  const startEdit = (blog) => {
    setEditingId(blog.id);
    setFormData({
      title: blog.title, category: blog.category, date: blog.date, 
      imageUrl: blog.imageUrl, summary: blog.summary, content: blog.content
    });
    document.querySelector('.admin-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: '', category: '', date: '', imageUrl: '', summary: '', content: '' });
  };

  const currentBlog = useMemo(() => blogs.find(b => b.slug === currentSlug), [blogs, currentSlug]);

  if (loading) {
    return (
      <div className="loader-container">
        <Loader2 className="spinner" size={48} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap');

        :root {
          --bg: #FAF7F2;
          --text: #1C1C1C;
          --muted: #6B6B6B;
          --accent: #B45309;
          --secondary: #14532D;
          --white: #FFFFFF;
          --radius-lg: 40px;
          --radius-md: 20px;
          --transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background-color: var(--bg);
          color: var(--text);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        .app-layout { display: flex; min-height: 100vh; align-items: stretch; }

        .sidebar-art {
          width: 25%;
          position: sticky;
          top: 0;
          height: 100vh;
          background-size: cover;
          background-position: center;
          box-shadow: inset -5px 0 15px rgba(0,0,0,0.03);
          overflow: hidden;
          flex-shrink: 0;
          background-color: #fff;
        }

        @media (max-width: 1024px) {
          .app-layout { flex-direction: column; }
          .sidebar-art { width: 100%; height: 40vh; position: relative; }
        }

        .main-content { flex: 1; padding: 4rem 8%; position: relative; }

        .nav-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5rem; }

        .btn-admin {
          background: var(--text);
          color: var(--white);
          border: none;
          padding: 0.8rem 1.8rem;
          border-radius: 100px;
          font-weight: 800;
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          transition: var(--transition);
        }

        .btn-admin:hover { background: var(--secondary); transform: scale(1.05); }

        .brand-title { font-family: 'Playfair Display', serif; font-size: clamp(3rem, 10vw, 6rem); font-weight: 900; margin-bottom: 0.5rem; }

        .tagline-group { display: flex; gap: 1.5rem; margin-bottom: 6rem; align-items: flex-start; }
        .tag-prefix { font-size: 0.6rem; font-weight: 900; color: var(--muted); letter-spacing: 0.3em; padding-top: 0.6rem; }
        .tagline-text { max-width: 550px; font-size: 1.2rem; color: var(--muted); }

        .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 3rem; }

        .blog-card {
          background: var(--white);
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          transition: var(--transition);
          border: 1px solid rgba(0,0,0,0.03);
        }
        .blog-card:hover { transform: translateY(-15px); box-shadow: 0 30px 70px rgba(0,0,0,0.08); }

        .card-image-box { position: relative; height: 300px; overflow: hidden; }
        .card-img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%); transition: var(--transition); }
        .blog-card:hover .card-img { filter: grayscale(0); transform: scale(1.08); }

        .card-body { padding: 2.5rem; display: flex; flex-direction: column; }
        .card-category { font-size: 0.7rem; font-weight: 900; color: var(--accent); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 1rem; }
        .card-title { font-size: 1.6rem; font-weight: 800; margin-bottom: 1rem; color: var(--text); }

        .card-footer { border-top: 1px solid #F5F1EB; padding-top: 1.8rem; display: flex; justify-content: space-between; }

        .details-container { max-width: 950px; margin: 0 auto; animation: slideUpFade 0.7s ease-out; }
        .hero-img { width: 100%; height: 600px; object-fit: cover; border-radius: var(--radius-lg); margin-bottom: 5rem; }

        /* Login & Admin Panel */
        .admin-overlay {
          position: fixed;
          inset: 0;
          background: rgba(28, 28, 28, 0.4);
          backdrop-filter: blur(12px);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 0.4s ease;
        }

        .admin-panel {
          width: 100%;
          max-width: 700px;
          background: var(--bg);
          height: 100%;
          padding: 4rem;
          overflow-y: auto;
          box-shadow: -30px 0 80px rgba(0,0,0,0.15);
          animation: slideInRight 0.6s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .login-box {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .input-group {
          position: relative;
          width: 100%;
          margin-bottom: 1.5rem;
        }

        .input-icon {
          position: absolute;
          left: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
        }

        .input, .textarea {
          width: 100%;
          padding: 1.25rem 1.25rem 1.25rem 3.5rem;
          border: 2px solid #E5E0D8;
          border-radius: 16px;
          background: var(--white);
          font-family: inherit;
          transition: var(--transition);
        }
        .input:focus { outline: none; border-color: var(--accent); }

        .btn-submit {
          width: 100%;
          padding: 1.5rem;
          background: var(--text);
          color: var(--white);
          border: none;
          border-radius: 20px;
          font-weight: 900;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-submit:hover { background: var(--secondary); transform: translateY(-3px); }

        .loader-container { display: flex; justify-content: center; align-items: center; height: 100vh; }
        .spinner { animation: rotateSpinner 1s linear infinite; color: var(--accent); }

        @keyframes rotateSpinner { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="sidebar-art" style={{ backgroundImage: `url(${MainCover})` }}></div>

      <main className="main-content">
        <nav className="nav-bar">
          <button onClick={() => setView('home')} className="btn-icon" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Home size={26} color={COLORS.text} />
          </button>
          <button onClick={() => setIsAdminOpen(true)} className="btn-admin">
            <Lock size={16} /> ADMIN ACCESS
          </button>
        </nav>

        {view === 'home' ? (
          <section>
            <h1 className="brand-title">BlogFlow</h1>
            <div className="tagline-group">
              <span className="tag-prefix">//STORY//</span>
              <p className="tagline-text">An organic digital canvas for design reflections and shared stories.</p>
            </div>
            <div className="blog-grid">
              {blogs.map(blog => (
                <article key={blog.id} className="blog-card" onClick={() => { setView('details'); setCurrentSlug(blog.slug); window.scrollTo(0,0); }}>
                  <div className="card-image-box"><img src={blog.imageUrl} className="card-img" /></div>
                  <div className="card-body">
                    <span className="card-category">{blog.category}</span>
                    <h3 className="card-title">{blog.title}</h3>
                    <div className="card-footer">
                      <span style={{ fontSize: '0.75rem', color: COLORS.muted }}>{new Date(blog.date).toLocaleDateString()}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 900, color: COLORS.accent }}>READ &rarr;</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="details-container">
            <button className="btn-back" onClick={() => setView('home')}><ArrowLeft size={16} /> BACK TO FLOW</button>
            <img src={currentBlog?.imageUrl} className="hero-img" />
            <h1 className="brand-title" style={{ fontSize: '3.5rem' }}>{currentBlog?.title}</h1>
            <div style={{ marginTop: '3rem', fontSize: '1.25rem' }}>
              {currentBlog?.content.split('\n').map((p, i) => <p key={i} style={{ marginBottom: '1.5rem' }}>{p}</p>)}
            </div>
          </section>
        )}
      </main>

      {/* Admin Gateway (Overlay) */}
      {isAdminOpen && (
        <div className="admin-overlay" onClick={(e) => e.target.className === 'admin-overlay' && setIsAdminOpen(false)}>
          <div className="admin-panel">
            {!isAdminLoggedIn ? (
              /* LOGIN PAGE */
              <div className="login-box">
                <Lock size={48} color={COLORS.accent} style={{ marginBottom: '2rem' }} />
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '2.5rem', marginBottom: '1rem' }}>Admin Gateway</h2>
                <p style={{ color: COLORS.muted, marginBottom: '3rem' }}>Please enter credentials to manage the flow. Attempts are logged to Firebase.</p>
                
                <form onSubmit={handleAdminLogin} style={{ width: '100%', maxWidth: '400px' }}>
                  <div className="input-group">
                    <User className="input-icon" size={20} />
                    <input 
                      className="input" 
                      placeholder="Username" 
                      value={loginCreds.username}
                      onChange={(e) => setLoginCreds({...loginCreds, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <Key className="input-icon" size={20} />
                    <input 
                      className="input" 
                      type="password" 
                      placeholder="Password" 
                      value={loginCreds.password}
                      onChange={(e) => setLoginCreds({...loginCreds, password: e.target.value})}
                      required
                    />
                  </div>
                  <button className="btn-submit" type="submit" disabled={loginLoading}>
                    {loginLoading ? <Loader2 className="spinner" size={20} /> : 'IDENTIFY ADMIN'}
                  </button>
                </form>
                <button 
                  onClick={() => setIsAdminOpen(false)} 
                  style={{ marginTop: '2rem', background: 'none', border: 'none', color: COLORS.muted, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel Access
                </button>
              </div>
            ) : (
              /* ADMIN CMS CONTENT (Only visible after login) */
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
                  <h2 style={{ fontFamily: 'Playfair Display', fontSize: '2.5rem' }}>Story Manager</h2>
                  <button className="btn-icon" onClick={() => { setIsAdminOpen(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={36} /></button>
                </div>

                <form onSubmit={handleFormSubmit}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: COLORS.muted, display: 'block', marginBottom: '0.5rem' }}>TITLE</label>
                    <input className="input" style={{ paddingLeft: '1.25rem' }} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: COLORS.muted, display: 'block', marginBottom: '0.5rem' }}>CATEGORY</label>
                      <input className="input" style={{ paddingLeft: '1.25rem' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: COLORS.muted, display: 'block', marginBottom: '0.5rem' }}>DATE</label>
                      <input className="input" style={{ paddingLeft: '1.25rem' }} type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: COLORS.muted, display: 'block', marginBottom: '0.5rem' }}>IMAGE URL</label>
                    <input className="input" style={{ paddingLeft: '1.25rem' }} value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} required />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: COLORS.muted, display: 'block', marginBottom: '0.5rem' }}>CONTENT</label>
                    <textarea className="textarea" style={{ paddingLeft: '1.25rem', minHeight: '200px' }} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required />
                  </div>
                  <button className="btn-submit" type="submit">{editingId ? 'UPDATE STORY' : 'PUBLISH TO FLOW'}</button>
                </form>

                <div style={{ marginTop: '4rem', borderTop: '2px dashed #E5E0D8', paddingTop: '3rem' }}>
                  <h3 style={{ marginBottom: '2rem', fontWeight: 800 }}>ACTIVE STORIES</h3>
                  {blogs.map(blog => (
                    <div key={blog.id} style={{ display: 'flex', alignItems: 'center', background: '#FFF', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
                      <img src={blog.imageUrl} style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', marginRight: '1rem' }} />
                      <div style={{ flex: 1 }}><p style={{ fontWeight: 800 }}>{blog.title}</p></div>
                      <button onClick={() => startEdit(blog)} style={{ background: 'none', border: 'none', color: COLORS.accent, cursor: 'pointer', margin: '0 0.5rem' }}><Edit size={20} /></button>
                      <button onClick={() => handleDelete(blog.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}><Trash2 size={20} /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setIsAdminLoggedIn(false)} style={{ marginTop: '2rem', color: 'red', fontWeight: 800, cursor: 'pointer', background: 'none', border: 'none' }}>LOGOUT</button>
              </>
            )}
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: '40px', right: '40px', background: COLORS.secondary, color: '#FFF', padding: '1rem 2.5rem', borderRadius: '50px', fontWeight: 800, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 2000 }}>{toast}</div>}
    </div>
  );
}

const COLORS = {
  bg: '#FAF7F2',
  text: '#1C1C1C',
  muted: '#6B6B6B',
  accent: '#B45309',
  secondary: '#14532D',
};