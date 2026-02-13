import React from 'react';
import { Home, Settings, LogOut } from 'lucide-react';

export default function Navbar({ onHome, onManage, onLogout }) {
  return (
    <nav className="nav-bar">
      <button onClick={onHome} className="btn-icon" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <Home size={26} />
      </button>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={onManage} className="btn-admin">
          <Settings size={16} /> MANAGE CONTENT
        </button>
        <button onClick={onLogout} className="btn-admin" style={{ background: 'rgba(0,0,0,0.05)', color: 'red' }}>
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
