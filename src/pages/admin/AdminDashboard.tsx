import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import type { Complaint, DashboardStats } from '../../types';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ total: 0, pending: 0, in_progress: 0, completed: 0, rejected: 0 });
  const [recent, setRecent] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: complaints } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (complaints) {
      setRecent(complaints);
      const all = await supabase.from('complaints').select('status');
      if (all.data) {
        setStats({
          total: all.data.length,
          pending: all.data.filter((c) => ['submitted', 'under_review', 'accepted'].includes(c.status)).length,
          in_progress: all.data.filter((c) => ['assigned', 'in_progress'].includes(c.status)).length,
          completed: all.data.filter((c) => c.status === 'completed').length,
          rejected: all.data.filter((c) => c.status === 'rejected').length,
        });
      }
    }
    setLoading(false);
  }

  const statCards = [
    { label: 'Total Complaints', value: stats.total, color: 'bg-navy-600', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Pending Review', value: stats.pending, color: 'bg-amber-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'In Progress', value: stats.in_progress, color: 'bg-blue-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Completed', value: stats.completed, color: 'bg-green-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Rejected', value: stats.rejected, color: 'bg-red-500', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-navy-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, {profile?.full_name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
              </svg>
            </div>
            <p className="text-2xl font-bold text-navy-800">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link to="/admin/complaints" className="px-4 py-2 bg-navy-700 text-white rounded-lg text-sm font-medium hover:bg-navy-800 transition">
          View All Complaints
        </Link>
        <Link to="/admin/users" className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
          Manage Users
        </Link>
        <Link to="/admin/reports" className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
          Reports
        </Link>
      </div>

      {/* Recent complaints */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-navy-800">Recent Complaints</h2>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No complaints yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">ID</th>
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-left">Priority</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">#{c.id.slice(0, 8)}</td>
                    <td className="px-5 py-3">
                      <Link to={`/admin/complaints/${c.id}`} className="text-navy-700 font-medium hover:text-navy-900">{c.title}</Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.category}</td>
                    <td className="px-5 py-3"><PriorityBadge priority={c.official_priority || c.suggested_priority} /></td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
