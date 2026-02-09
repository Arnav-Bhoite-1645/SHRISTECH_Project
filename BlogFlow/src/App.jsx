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
  Plus
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

// --- Firebase Configuration Logic ---
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
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    date: '',
    imageUrl: '',
    summary: '',
    content: ''
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
    const unsubscribeBlogs = onSnapshot(blogsRef, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setBlogs(sortedData);
        setLoading(false);
      }, 
      (error) => {
        console.error("Firestore sync error:", error);
        setLoading(false);
      }
    );
    return () => unsubscribeBlogs();
  }, [user]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast("Authentication required to publish.");
      return;
    }
    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const blogData = { ...formData, slug, updatedAt: new Date().toISOString() };
    try {
      const collRef = collection(db, 'artifacts', appId, 'public', 'data', 'blogs');
      if (editingId) {
        await updateDoc(doc(collRef, editingId), blogData);
        showToast("Story updated successfully.");
      } else {
        await addDoc(collRef, blogData);
        showToast("New story added to the flow.");
      }
      resetForm();
      setIsAdminOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      showToast("Error saving story.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this story?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'blogs', id));
      showToast("Story deleted.");
    } catch (err) {
      showToast("Failed to delete.");
    }
  };

  const startEdit = (blog) => {
    setEditingId(blog.id);
    setFormData({
      title: blog.title,
      category: blog.category,
      date: blog.date,
      imageUrl: blog.imageUrl,
      summary: blog.summary,
      content: blog.content
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

        .app-layout { 
          display: flex; 
          min-height: 100vh; 
          align-items: stretch; /* Ensure children stretch vertically */
        }

        /* Sidebar - Full Height Fixed Swirl */
        .sidebar-art {
          width: 25%;
          position: sticky;
          top: 0;
          height: 100vh; /* Fills the screen height */
          background-image: url('http://localhost:5178/cover-images/Main-cover.png');
          background-size: cover;
          background-position: center;
          box-shadow: inset -10px 0 30px rgba(0,0,0,0.1);
          overflow: hidden;
          flex-shrink: 0; /* Don't let it shrink in flex container */
        }

        .sidebar-art::after {
          content: "";
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.15;
          mix-blend-mode: overlay;
        }

        @media (max-width: 1024px) {
          .app-layout { flex-direction: column; }
          .sidebar-art { 
            width: 100%; 
            height: 40vh; /* Increased height for better mobile presentation */
            position: relative; 
            box-shadow: none; 
          }
        }

        .main-content {
          flex: 1;
          padding: 4rem 8%;
          position: relative;
        }

        @media (max-width: 640px) { .main-content { padding: 2rem 1.5rem; } }

        .nav-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5rem;
        }

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

        .btn-admin:hover { 
          background: var(--secondary); 
          transform: scale(1.05); 
          box-shadow: 0 10px 25px rgba(20, 83, 45, 0.2); 
        }

        .brand-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3rem, 10vw, 6rem);
          font-weight: 900;
          letter-spacing: -0.05em;
          margin-bottom: 0.5rem;
          color: var(--text);
        }

        .tagline-group { display: flex; gap: 1.5rem; margin-bottom: 6rem; align-items: flex-start; }
        .tag-prefix { font-size: 0.6rem; font-weight: 900; color: var(--muted); letter-spacing: 0.3em; padding-top: 0.6rem; white-space: nowrap; }
        .tagline-text { max-width: 550px; font-size: 1.2rem; color: var(--muted); font-weight: 500; }

        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 3rem;
        }

        .blog-card {
          background: var(--white);
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(0,0,0,0.03);
        }

        .blog-card:hover {
          transform: translateY(-15px);
          box-shadow: 0 30px 70px rgba(0,0,0,0.08);
        }

        .card-image-box { position: relative; height: 300px; overflow: hidden; }
        .card-img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%); transition: var(--transition); }
        .blog-card:hover .card-img { filter: grayscale(0); transform: scale(1.08); }

        .card-body { padding: 2.5rem; flex-grow: 1; display: flex; flex-direction: column; }
        .card-category { font-size: 0.7rem; font-weight: 900; color: var(--accent); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 1rem; }
        .card-title { font-size: 1.6rem; font-weight: 800; margin-bottom: 1rem; line-height: 1.25; color: var(--text); }
        .card-summary { color: var(--muted); font-size: 1rem; line-height: 1.7; margin-bottom: 2rem; flex-grow: 1; }

        .card-footer {
          border-top: 1px solid #F5F1EB;
          padding-top: 1.8rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-date { color: var(--muted); font-size: 0.75rem; font-weight: 600; }
        .card-more { color: var(--accent); font-weight: 900; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; }

        .details-container { max-width: 950px; margin: 0 auto; animation: slideUpFade 0.7s ease-out; }
        .btn-back {
          background: none;
          border: none;
          font-weight: 900;
          font-size: 0.7rem;
          color: var(--muted);
          letter-spacing: 0.2em;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 3rem;
          transition: var(--transition);
        }
        .btn-back:hover { color: var(--accent); transform: translateX(-10px); }

        .hero-img {
          width: 100%;
          height: 600px;
          object-fit: cover;
          border-radius: var(--radius-lg);
          margin-bottom: 5rem;
          box-shadow: 0 40px 100px rgba(0,0,0,0.12);
        }

        .details-header { margin-bottom: 5rem; }
        .details-title { font-family: 'Playfair Display', serif; font-size: clamp(2.5rem, 8vw, 4.5rem); line-height: 1.1; margin-top: 1rem; font-weight: 900; }

        .details-content-grid { display: grid; grid-template-columns: 250px 1fr; gap: 5rem; }
        @media (max-width: 850px) { .details-content-grid { grid-template-columns: 1fr; gap: 3rem; } }

        .aside-meta { position: sticky; top: 4rem; border-top: 3px solid var(--text); padding-top: 2rem; }
        .aside-label { display: block; font-size: 0.6rem; font-weight: 900; color: var(--muted); text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 0.4rem; }
        .aside-value { display: block; font-weight: 800; margin-bottom: 2.5rem; font-size: 1.1rem; }

        .body-text { font-size: 1.25rem; line-height: 1.9; color: #2D2D2D; }
        .body-text p { margin-bottom: 2rem; }

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

        .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4rem; }
        .panel-title { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 900; }

        .form-group { margin-bottom: 2rem; }
        .form-label { display: block; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 0.8rem; }
        
        .input, .textarea {
          width: 100%;
          padding: 1.25rem;
          border: 2px solid #E5E0D8;
          border-radius: 16px;
          background: var(--white);
          font-family: inherit;
          font-size: 1rem;
          transition: var(--transition);
        }
        .input:focus, .textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 4px rgba(180, 83, 9, 0.05); }
        .textarea { min-height: 180px; resize: vertical; }

        .btn-submit {
          width: 100%;
          padding: 1.5rem;
          background: var(--text);
          color: var(--white);
          border: none;
          border-radius: 20px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: var(--transition);
          margin-top: 1rem;
        }
        .btn-submit:hover { background: var(--secondary); transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }

        .admin-items { margin-top: 5rem; border-top: 2px dashed #E5E0D8; padding-top: 4rem; }
        .list-item {
          background: var(--white);
          padding: 1.2rem;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1rem;
          border: 1px solid rgba(0,0,0,0.02);
        }
        .list-item img { width: 60px; height: 60px; border-radius: 14px; object-fit: cover; }
        .list-info { flex: 1; }
        .list-title { font-weight: 800; font-size: 1rem; margin-bottom: 0.2rem; }
        .list-cat { font-size: 0.65rem; color: var(--muted); font-weight: 800; text-transform: uppercase; }

        .toast-notif {
          position: fixed;
          bottom: 40px;
          right: 40px;
          background: var(--secondary);
          color: var(--white);
          padding: 1.2rem 2.8rem;
          border-radius: 100px;
          font-weight: 800;
          letter-spacing: 0.05em;
          box-shadow: 0 20px 50px rgba(0,0,0,0.25);
          animation: toastPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 2000;
        }

        .loader-container { display: flex; justify-content: center; align-items: center; height: 100vh; }
        .spinner { animation: rotateSpinner 1s linear infinite; color: var(--accent); }

        @keyframes rotateSpinner { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastPop { from { transform: translateY(100px) scale(0.8); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
      `}</style>

      {/* Full-Height Swirl Sidebar */}
      <div className="sidebar-art"></div>

      {/* Main Flow Area */}
      <main className="main-content">
        <nav className="nav-bar">
          <button onClick={() => setView('home')} className="btn-icon" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
            <Home size={26} color={COLORS.text} />
          </button>
          <button onClick={() => setIsAdminOpen(true)} className="btn-admin">
            <Settings size={18} /> ADMIN ACCESS
          </button>
        </nav>

        {view === 'home' ? (
          <section className="home-view">
            <header>
              <h1 className="brand-title">BlogFlow</h1>
              <div className="tagline-group">
                <span className="tag-prefix">//STORY//</span>
                <p className="tagline-text">
                  An organic digital canvas for ideas, shared perspectives, and design reflections that flow naturally from mind to screen.
                </p>
              </div>
            </header>

            <div className="blog-grid">
              {blogs.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 0', opacity: 0.4 }}>
                  <p className="tag-prefix">The flow is quiet. Add a story to begin.</p>
                </div>
              ) : (
                blogs.map(blog => (
                  <article key={blog.id} className="blog-card" onClick={() => { setView('details'); setCurrentSlug(blog.slug); window.scrollTo(0,0); }}>
                    <div className="card-image-box">
                      <img src={blog.imageUrl} className="card-img" alt={blog.title} />
                    </div>
                    <div className="card-body">
                      <span className="card-category">{blog.category}</span>
                      <h3 className="card-title">{blog.title}</h3>
                      <p className="card-summary">{blog.summary}</p>
                      <div className="card-footer">
                        <span className="card-date">{new Date(blog.date).toLocaleDateString()}</span>
                        <span className="card-more">Explore &rarr;</span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : (
          <section className="details-container">
            <button className="btn-back" onClick={() => setView('home')}>
              <ArrowLeft size={16} /> BACK TO FLOW
            </button>
            
            <img src={currentBlog?.imageUrl} className="hero-img" alt={currentBlog?.title} />
            
            <header className="details-header">
              <span className="card-category">{currentBlog?.category}</span>
              <h1 className="details-title">{currentBlog?.title}</h1>
            </header>

            <div className="details-content-grid">
              <aside className="aside-meta">
                <span className="aside-label">Publication</span>
                <span className="aside-value">{new Date(currentBlog?.date).toLocaleDateString()}</span>
                
                <span className="aside-label">Contributor</span>
                <span className="aside-value">Staff Editor</span>

                <div className="social-icons" style={{ display: 'flex', gap: '1.2rem', color: '#888' }}>
                  <Twitter size={20} style={{ cursor: 'pointer' }} />
                  <Facebook size={20} style={{ cursor: 'pointer' }} />
                  <Linkedin size={20} style={{ cursor: 'pointer' }} />
                </div>
              </aside>

              <div className="body-text">
                {currentBlog?.content.split('\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Admin Panel */}
      {isAdminOpen && (
        <div className="admin-overlay" onClick={(e) => e.target.className === 'admin-overlay' && setIsAdminOpen(false)}>
          <div className="admin-panel">
            <div className="panel-header">
              <h2 className="panel-title">Story Manager</h2>
              <button className="btn-icon" onClick={() => { setIsAdminOpen(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={36} color={COLORS.text} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Article Title</label>
                <input 
                  className="input" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  required 
                  placeholder="The headline..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required placeholder="e.g. Design" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="input" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cover Image URL</label>
                <input className="input" type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} required placeholder="Unsplash URL..." />
              </div>

              <div className="form-group">
                <label className="form-label">Summary (SEO Excerpt)</label>
                <input className="input" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} required placeholder="A brief hook..." />
              </div>

              <div className="form-group">
                <label className="form-label">Full Content</label>
                <textarea className="textarea" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required placeholder="Write the flow..." />
              </div>

              <button className="btn-submit" type="submit">
                {editingId ? 'Update this Story' : 'Publish to Flow'}
              </button>
            </form>

            <div className="admin-items">
              <h3 className="form-label" style={{ marginBottom: '2rem', borderBottom: '2px solid #EEE', paddingBottom: '0.5rem', color: COLORS.text }}>Active Flow</h3>
              {blogs.map(blog => (
                <div key={blog.id} className="list-item">
                  <img src={blog.imageUrl} alt="" />
                  <div className="list-info">
                    <p className="list-title">{blog.title}</p>
                    <p className="list-cat" style={{ color: COLORS.muted, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>{blog.category}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => startEdit(blog)} style={{ background: 'none', border: 'none', color: COLORS.accent, cursor: 'pointer' }}><Edit size={20} /></button>
                    <button onClick={() => handleDelete(blog.id)} style={{ background: 'none', border: 'none', color: '#D92D20', cursor: 'pointer' }}><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-notif">{toast}</div>}
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