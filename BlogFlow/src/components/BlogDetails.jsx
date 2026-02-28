import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function BlogDetails({ blog, onBack }) {
  if (!blog) return null;
  return (
    <section className="details-container">
      <button className="btn-back" onClick={onBack}><ArrowLeft size={16} /> BACK TO FLOW</button>
      <img src={blog.imageUrl} className="hero-img" alt={blog.title} />
      <h1 className="brand-title" style={{ fontSize: '3.5rem' }}>{blog.title}</h1>
      {blog.author && <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>by {blog.author}</p>}
      <div style={{ marginTop: '3rem', fontSize: '1.25rem' }}>
        {blog.content.split('\n').map((p, i) => <p key={i} style={{ marginBottom: '1.5rem' }}>{p}</p>)}
      </div>
    </section>
  );
}
