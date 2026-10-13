import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Complaint } from '../../types';
import { COMPLAINT_CATEGORIES } from '../../lib/constants';

export default function Reports() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('complaints').select('*');
      if (data) setComplaints(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-navy-600 border-t-transparent rounded-full animate-spin" /></div>;

  // Category breakdown
  const categoryCounts = COMPLAINT_CATEGORIES.map((cat) => ({
    category: cat,
    count: complaints.filter((c) => c.category === cat).length,
  })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  // Status breakdown
  const statusCounts = [
    { label: 'Submitted', count: complaints.filter((c) => c.status === 'submitted').length, color: 'bg-blue-500' },
    { label: 'In Progress', count: complaints.filter((c) => ['accepted', 'assigned', 'in_progress'].includes(c.status)).length, color: 'bg-orange-500' },
    { label: 'Resolution Pending', count: complaints.filter((c) => c.status === 'resolution_submitted').length, color: 'bg-teal-500' },
    { label: 'Completed', count: complaints.filter((c) => c.status === 'completed').length, color: 'bg-green-500' },
    { label: 'Rejected', count: complaints.filter((c) => c.status === 'rejected').length, color: 'bg-red-500' },
    { label: 'Rework', count: complaints.filter((c) => c.status === 'rework_requested').length, color: 'bg-rose-500' },
  ];

  const maxCat = Math.max(...categoryCounts.map((c) => c.count), 1);

  // Monthly trend (last 6 months)
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.getMonth();
    const year = d.getFullYear();
    const count = complaints.filter((c) => {
      const cd = new Date(c.created_at);
      return cd.getMonth() === month && cd.getFullYear() === year;
    }).length;
    months.push({ label: d.toLocaleString('default', { month: 'short', year: '2-digit' }), count });
  }
  const maxMonth = Math.max(...months.map((m) => m.count), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-800 mb-6">Reports & Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-navy-800 mb-4">Status Overview</h3>
          <div className="space-y-3">
            {statusCounts.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-36">{s.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${complaints.length ? (s.count / complaints.length) * 100 : 0}%` }} />
                </div>
                <span className="text-sm font-semibold text-navy-800 w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-navy-800 mb-4">Top Categories</h3>
          <div className="space-y-2">
            {categoryCounts.slice(0, 8).map((c) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-28 truncate">{c.category}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full bg-navy-500 rounded-full transition-all" style={{ width: `${(c.count / maxCat) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-navy-800 w-6 text-right">{c.count}</span>
              </div>
            ))}
            {categoryCounts.length === 0 && <p className="text-slate-400 text-sm">No data yet</p>}
          </div>
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
          <h3 className="font-semibold text-navy-800 mb-4">Monthly Trend (Last 6 Months)</h3>
          <div className="flex items-end gap-2 h-40">
            {months.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-navy-800">{m.count}</span>
                <div className="w-full bg-navy-500 rounded-t transition-all" style={{ height: `${(m.count / maxMonth) * 100}%`, minHeight: m.count > 0 ? '4px' : '0' }} />
                <span className="text-[10px] text-slate-500">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
          <h3 className="font-semibold text-navy-800 mb-3">Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-bold text-navy-800">{complaints.length}</p><p className="text-xs text-slate-500">Total</p></div>
            <div><p className="text-2xl font-bold text-green-600">{complaints.filter((c) => c.status === 'completed').length}</p><p className="text-xs text-slate-500">Resolved</p></div>
            <div><p className="text-2xl font-bold text-red-600">{complaints.filter((c) => c.status === 'rejected').length}</p><p className="text-xs text-slate-500">Rejected</p></div>
            <div>
              <p className="text-2xl font-bold text-navy-800">
                {complaints.length > 0 ? Math.round((complaints.filter((c) => c.status === 'completed').length / complaints.length) * 100) : 0}%
              </p>
              <p className="text-xs text-slate-500">Resolution Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
