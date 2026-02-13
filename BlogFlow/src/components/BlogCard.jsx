import React from 'react';

export default function BlogCard({ blog, onOpen }) {
  return (
    <article className="blog-card" onClick={() => onOpen(blog)}>
      <div className="card-image-box">
        <img src={blog.imageUrl} className="card-img" alt={blog.title} />
      </div>
      <div className="card-body">
        <span className="card-category">{blog.category}</span>
        <h3 className="card-title">{blog.title}</h3>
        <div className="card-footer">
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(blog.date).toLocaleDateString()}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)' }}>READ →</span>
        </div>
      </div>
    </article>
  );
}
