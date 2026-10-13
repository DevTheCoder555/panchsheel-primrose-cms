import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfigured) { setError('Supabase not configured. See setup instructions.'); return; }
    setError('');
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-800 via-navy-700 to-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-rose-accent rounded-xl flex items-center justify-center font-display text-white font-bold text-2xl shadow-lg">P</div>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Panchsheel Primrose</h1>
          <p className="text-navy-300 text-sm mt-1">Society Complaint Management System</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-xl p-7">
          <h2 className="text-xl font-bold text-navy-800 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none transition"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none transition"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-navy-700 text-white rounded-lg text-sm font-medium hover:bg-navy-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-slate-500">
              Resident? <Link to="/register" className="text-navy-600 font-medium hover:text-navy-800">Create an account</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-navy-400 text-xs mt-6">
          Admin & Staff: Contact your administrator for login credentials.
        </p>
      </div>
    </div>
  );
}
