import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TOWERS } from '../../lib/constants';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', tower: '', flat: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfigured) { setError('Supabase not configured.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    const result = await signUp(form.email, form.password, form.fullName, 'resident', form.phone, form.tower, form.flat);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    navigate('/login');
  }

  const inputClass = "w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none transition";

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-800 via-navy-700 to-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-accent rounded-xl flex items-center justify-center font-display text-white font-bold text-xl shadow-lg">P</div>
          </div>
          <h1 className="font-display text-xl font-bold text-white">Create Resident Account</h1>
          <p className="text-navy-300 text-sm mt-1">Register to submit and track complaints</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-7">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required className={inputClass} placeholder="Rakesh Sharma" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className={inputClass} placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tower</label>
                <select value={form.tower} onChange={(e) => update('tower', e.target.value)} className={inputClass}>
                  <option value="">Select</option>
                  {TOWERS.map((t) => <option key={t} value={t}>Tower {t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Flat No.</label>
                <input type="text" value={form.flat} onChange={(e) => update('flat', e.target.value)} className={inputClass} placeholder="e.g. 302" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
              <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required className={inputClass} placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required className={inputClass} placeholder="Repeat password" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-navy-700 text-white rounded-lg text-sm font-medium hover:bg-navy-800 disabled:opacity-50 transition-colors mt-2">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account? <Link to="/login" className="text-navy-600 font-medium hover:text-navy-800">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
