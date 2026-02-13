import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import BlogCard from './components/BlogCard';
import AdminModal from './components/AdminModal';
import BlogDetails from './components/BlogDetails';
import LoginForm from './components/LoginForm';
import './App.css';
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
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';

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
const storage = getStorage(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [view, setView] = useState('home'); 
  const [currentSlug, setCurrentSlug] = useState(null);
  
  // App Gating State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Login Form State
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  // Blog Form State
  const [editingId, setEditingId] = useState(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
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

  // --- Gated Login Handler ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const isSuccess = loginCreds.username === 'Arnav' && loginCreds.password === 'arnav123';

      // Ensure the client is authenticated before writing to Firestore.
      // Some Firestore rules require an authenticated user; attempting to write
      // without a user can produce a network/permission error seen as "Connection error".
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authErr) {
          console.error('Auth sign-in error:', authErr);
          throw new Error('Authentication failed: ' + (authErr && authErr.message ? authErr.message : authErr));
        }
      }

      // 1. Log attempt directly to Firebase as requested
      const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'admin_logs');
      await addDoc(logsRef, {
        username: loginCreds.username,
        password: loginCreds.password,
        timestamp: new Date().toISOString(),
        status: isSuccess ? 'success' : 'denied'
      });

      // 2. Validate Access
      if (isSuccess) {
        setIsAuthorized(true);
        showToast('Access Granted. Welcome back, Arnav.');
      } else {
        showToast('Access Denied. Check credentials.');
      }
    } catch (err) {
      console.error('Login Error:', err);
      const message = err && err.message ? err.message : 'Try again.';
      showToast('Connection error. ' + message);
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImageUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const storageRef = ref(storage, `blog-images/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload progress:', progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
            showToast('Image uploaded successfully.');
            resolve();
          }
        );
      });
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('Failed to upload image.');
    } finally {
      setIsImageUploading(false);
      e.target.value = '';
    }
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
      {/* Persistent Brand Sidebar */}
      <Sidebar />

      {!isAuthorized ? (
        <LoginForm loginCreds={loginCreds} setLoginCreds={setLoginCreds} loginLoading={loginLoading} handleLogin={handleLogin} />
      ) : (
        /* MAIN APPLICATION VIEW: Only shown after successful login */
        <main className="main-content">
          <Navbar onHome={() => setView('home')} onManage={() => setIsAdminOpen(true)} onLogout={() => setIsAuthorized(false)} />

            {view === 'home' ? (
            <section>
              <h1 className="brand-title">BlogFlow</h1>
              <div className="tagline-group">
                <span className="tag-prefix">//STORY//</span>
                <p className="tagline-text">Welcome back, Arnav. Explore design reflections and shared stories.</p>
              </div>
              <div className="blog-grid">
                {blogs.map(blog => (
                  <BlogCard key={blog.id} blog={blog} onOpen={(b) => { setView('details'); setCurrentSlug(b.slug); window.scrollTo(0,0); }} />
                ))}
              </div>
            </section>
          ) : (
            <BlogDetails blog={currentBlog} onBack={() => setView('home')} />
          )}

          {/* Admin CMS Modal */}
          {isAdminOpen && (
            <AdminModal
              onClose={() => setIsAdminOpen(false)}
              handleFormSubmit={handleFormSubmit}
              formData={formData}
              setFormData={setFormData}
              handleImageUpload={handleImageUpload}
              isImageUploading={isImageUploading}
              editingId={editingId}
              blogs={blogs}
              startEdit={startEdit}
              handleDelete={handleDelete}
              resetForm={resetForm}
            />
          )}
        </main>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
 