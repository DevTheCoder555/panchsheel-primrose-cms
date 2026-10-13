import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile, UserRole } from '../../types';

export default function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'maintenance' as UserRole, phone: '' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (roleFilter) query = query.eq('role', roleFilter);
    const { data } = await query;
    setUsers(data || []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const filtered = users.filter((u) =>
    !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    // Create auth user via Supabase admin would require edge function
    // For now, we insert profile directly (admin creates account, user resets password)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
    });

    if (authError) { setAddError(authError.message); setAddLoading(false); return; }

    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        phone: newUser.phone || null,
      });
      if (profileError) { setAddError('User created but profile failed: ' + profileError.message); }
    }

    setAddLoading(false);
    setShowAdd(false);
    setNewUser({ email: '', password: '', full_name: '', role: 'maintenance', phone: '' });
    loadUsers();
  }

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-700',
    maintenance: 'bg-purple-100 text-purple-700',
    resident: 'bg-blue-100 text-blue-700',
  };

  const inputClass = "w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none transition";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Manage Users</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-navy-700 text-white rounded-lg text-sm font-medium hover:bg-navy-800 transition">
          Add Staff/Admin
        </button>
      </div>

      {/* Add user modal */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="font-semibold text-navy-800 mb-4">Add New Staff/Admin User</h3>
          {addError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{addError}</div>}
          <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label><input type="text" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} required className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Password</label><input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required minLength={6} className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input type="tel" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className={inputClass} /></div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })} className={inputClass}>
                <option value="maintenance">Maintenance Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={addLoading} className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">Create User</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 outline-none" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | '')} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 outline-none">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="maintenance">Maintenance</option>
            <option value="resident">Resident</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-navy-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Location</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-navy-800">{u.full_name}</td>
                    <td className="px-5 py-3 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3 text-slate-600">{u.phone || '-'}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[u.role]}`}>{u.role}</span></td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{u.tower ? `Tower ${u.tower}, Flat ${u.flat}` : '-'}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
