import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import type { Complaint } from '../../types';

export default function ResidentDashboard() {
  const { profile, user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from('complaints').select('*').eq('resident_id', user.id).order('created_at', { ascending: false }).limit(5);
      setComplaints(data || []);
      setLoading(false);
    })();
  }, [user]);

  const total = complaints.length;
  const active = complaints.filter((c) => !['completed', 'rejected'].includes(c.status)).length;
  const resolved = complaints.filter((c) => c.status === 'completed').length;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-navy-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">My Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome, {profile?.full_name}</p>
        </div>
        <Link to="/resident/new" className="px-4 py-2 bg-navy-700 text-white rounded-lg text-sm font-medium hover:bg-navy-800 transition inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Complaint
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-navy-800">{total}</p>
          <p className="text-xs text-slate-500">Total Filed</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-orange-600">{active}</p>
          <p className="text-xs text-slate-500">Active</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-green-600">{resolved}</p>
          <p className="text-xs text-slate-500">Resolved</p>
        </div>
      </div>

      {/* Recent complaints */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-navy-800">Recent Complaints</h2>
          <Link to="/resident/complaints" className="text-navy-600 text-sm hover:text-navy-800">View all</Link>
        </div>
        {complaints.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No complaints yet. <Link to="/resident/new" className="text-navy-600 font-medium">File your first complaint</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((c) => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="font-medium text-navy-800 text-sm truncate">{c.title}</p>
                  <p className="text-xs text-slate-500">{c.category} | {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={c.official_priority || c.suggested_priority} />
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection notices */}
      {complaints.filter((c) => c.status === 'rejected' && c.rejection_reason).length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-red-700 mb-3">Rejection Notices</h3>
          {complaints.filter((c) => c.status === 'rejected' && c.rejection_reason).map((c) => (
            <div key={c.id} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-2">
              <p className="font-medium text-red-800 text-sm">{c.title}</p>
              <p className="text-red-700 text-xs mt-1">Reason: {c.rejection_reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
