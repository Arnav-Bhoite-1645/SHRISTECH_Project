import React from 'react';
import { Loader2, Mail, User, Key } from 'lucide-react';

export default function SignupForm({
  signupCreds,
  setSignupCreds,
  signupLoading,
  handleSignup,
  switchToLogin
}) {
  return (
    <main className="login-screen">
      <div className="login-card">
        <div style={{ color: 'var(--accent)', marginBottom: '2rem', display: 'inline-block' }}>
          <Mail size={48} />
        </div>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2.5rem', marginBottom: '1rem' }}>Create Account</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '3rem' }}>
          Sign up with email, a username and password.
        </p>
        <form onSubmit={handleSignup}>
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              className="input"
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={signupCreds.email}
              onChange={(e) => setSignupCreds({ ...signupCreds, email: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input
              className="input"
              placeholder="Username"
              autoComplete="username"
              value={signupCreds.username}
              onChange={(e) => setSignupCreds({ ...signupCreds, username: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <Key className="input-icon" size={20} />
            <input
              className="input"
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              value={signupCreds.password}
              onChange={(e) => setSignupCreds({ ...signupCreds, password: e.target.value })}
              required
            />
          </div>
          <button className="btn-submit" type="submit" disabled={signupLoading}>
            {signupLoading ? <Loader2 className="spinner" size={20} /> : 'CREATE ACCOUNT'}
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <button type="button" className="link" onClick={switchToLogin}>
            Log in
          </button>
        </p>
      </div>
    </main>
  );
}
