import React from 'react';
import { Loader2, X, Edit, Trash2 } from 'lucide-react';

export default function AdminModal({
  onClose,
  handleFormSubmit,
  formData,
  setFormData,
  handleImageUpload,
  isImageUploading,
  editingId,
  blogs,
  startEdit,
  handleDelete,
  resetForm,
}) {
  return (
    <div className="admin-overlay" onClick={(e) => e.target.className === 'admin-overlay' && onClose()}>
      <div className="admin-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '2.5rem' }}>Story Manager</h2>
          <button className="btn-icon" onClick={() => { onClose(); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={36} /></button>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>TITLE</label>
            <input className="input" style={{ paddingLeft: '1.25rem' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>CATEGORY</label>
              <input className="input" style={{ paddingLeft: '1.25rem' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>DATE</label>
              <input className="input" style={{ paddingLeft: '1.25rem' }} type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
            </div>
          </div>

          <div className="file-upload-wrapper">
            <label className="file-upload-label">IMAGE UPLOAD</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isImageUploading}
              className="file-upload-input"
              id="imageFileInput"
            />
            <label htmlFor="imageFileInput" className="file-upload-btn" style={{ cursor: isImageUploading ? 'not-allowed' : 'pointer' }}>
              {isImageUploading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Uploading...
                </>
              ) : (
                <>
                  📷 Choose Image
                </>
              )}
            </label>
            {formData.imageUrl && (
              <div className="file-upload-preview">✓ Image ready for upload</div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', display: 'block', marginBottom: '0.5rem' }}>CONTENT</label>
            <textarea className="textarea" style={{ paddingLeft: '1.25rem', minHeight: '200px' }} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required />
          </div>
          <button className="btn-submit" type="submit" disabled={isImageUploading}>{editingId ? 'UPDATE STORY' : 'PUBLISH TO FLOW'}</button>
        </form>

        <div style={{ marginTop: '4rem', borderTop: '2px dashed #E5E0D8', paddingTop: '3rem' }}>
          <h3 style={{ marginBottom: '2rem', fontWeight: 800 }}>ACTIVE STORIES</h3>
          {blogs.map(blog => (
            <div key={blog.id} style={{ display: 'flex', alignItems: 'center', background: '#FFF', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
              <img src={blog.imageUrl} style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', marginRight: '1rem' }} alt="" />
              <div style={{ flex: 1 }}><p style={{ fontWeight: 800 }}>{blog.title}</p></div>
              <button onClick={() => startEdit(blog)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', margin: '0 0.5rem' }}><Edit size={20} /></button>
              <button onClick={() => handleDelete(blog.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}><Trash2 size={20} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
