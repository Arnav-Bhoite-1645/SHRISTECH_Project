import React from 'react';
import { Loader2, Lock, User, Key } from 'lucide-react';

export default function LoginForm({ loginCreds, setLoginCreds, loginLoading, handleLogin }) {
  return (
    <main className="login-screen">
      <div className="login-card">
        <div style={{ color: 'var(--accent)', marginBottom: '2rem', display: 'inline-block' }}>
          <Lock size={48} />
        </div>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2.5rem', marginBottom: '1rem' }}>BlogFlow Entry</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '3rem' }}>Please identify yourself to access the flow.</p>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input
              className="input"
              placeholder="Username"
              autoComplete="username"
              value={loginCreds.username}
              onChange={(e) => setLoginCreds({ ...loginCreds, username: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <Key className="input-icon" size={20} />
            <input
              className="input"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={loginCreds.password}
              onChange={(e) => setLoginCreds({ ...loginCreds, password: e.target.value })}
              required
            />
          </div>
          <button className="btn-submit" type="submit" disabled={loginLoading}>
            {loginLoading ? <Loader2 className="spinner" size={20} /> : 'UNFOLD FLOW'}
          </button>
        </form>
      </div>
      <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Attempts are logged to secure database
      </p>
    </main>
  );
}
