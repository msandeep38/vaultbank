'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus]     = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage]   = useState('');
  const [user, setUser]         = useState<{ username: string; email: string; role: string } | null>(null);
  const [attempts, setAttempts] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setUser(data.user);
        setAttempts(0);
        setMessage('');
      } else {
        setAttempts(a => a + 1);
        setStatus('error');
        setMessage(data.error ?? 'Login failed.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error — could not reach the server.');
    }
  }

  if (status === 'success' && user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="bg-[#0d1526] border border-green-700/40 rounded-2xl p-10 max-w-md w-full text-center fade-in">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Login Successful</h2>
          <p className="text-gray-400 mb-6">Welcome back, <span className="text-white font-semibold">{user.username}</span></p>
          <div className="bg-[#060c1a] rounded-xl p-4 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-300">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Role</span>
              <span className="text-blue-400 capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account ID</span>
              <span className="text-gray-300">#{user.username}</span>
            </div>
          </div>
          <button
            onClick={() => { setStatus('idle'); setUser(null); setUsername(''); setPassword(''); }}
            className="mt-6 w-full py-3 border border-[#1a2744] hover:border-blue-700 text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏦</div>
          <h1 className="text-3xl font-bold text-white">Sign in to VaultBank</h1>
          <p className="text-gray-500 mt-2 text-sm">Enter your credentials to access your account</p>
        </div>

        {/* Demo credentials hint */}
        <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4 mb-6 text-sm">
          <p className="text-blue-400 font-semibold mb-2">Demo Credentials</p>
          <div className="space-y-1 text-gray-400">
            <div><span className="text-gray-300">admin</span> / <span className="text-gray-300">Admin@123</span></div>
            <div><span className="text-gray-300">john_smith</span> / <span className="text-gray-300">Pass@456</span></div>
            <div><span className="text-gray-300">jane_doe</span> / <span className="text-gray-300">Secret@789</span></div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#0d1526] border border-[#1a2744] rounded-2xl p-8 space-y-5"
        >
          <div>
            <label className="block text-sm text-gray-400 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              required
              className="w-full bg-[#060c1a] border border-[#1a2744] focus:border-blue-600 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#060c1a] border border-[#1a2744] focus:border-blue-600 text-white placeholder-gray-600 px-4 py-3 rounded-xl outline-none transition-colors text-sm"
            />
          </div>

          {status === 'error' && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-3 text-sm text-red-400">
              ⚠️ {message}
              {attempts >= 2 && (
                <span className="block mt-1 text-red-500 font-semibold">
                  Warning: {attempts} failed attempt{attempts > 1 ? 's' : ''}. CyberShield will block after 3.
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {status === 'loading' ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* CyberShield brute force note */}
        <div className="mt-4 text-center text-xs text-gray-600">
          🛡️ CyberShield monitors login attempts · IP blocked after 3 failures
        </div>
      </div>
    </div>
  );
}
