import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { COMPLAINT_CATEGORIES } from '../../lib/constants';
import type { Complaint, ComplaintStatus } from '../../types';

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadComplaints(); }, []);

  async function loadComplaints() {
    setLoading(true);
    let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    if (categoryFilter) query = query.eq('category', categoryFilter);
    const { data } = await query;
    setComplaints(data || []);
    setLoading(false);
  }

  useEffect(() => { loadComplaints(); }, [statusFilter, categoryFilter]);

  const filtered = complaints.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.id.includes(search) || c.category.toLowerCase().includes(search.toLowerCase())
  );

  function exportToCSV() {
    const headers = ['ID', 'Title', 'Category', 'Problem Type', 'Location', 'Priority', 'Status', 'Created', 'Due Date'];
    const rows = filtered.map((c) => [
      c.id.slice(0, 8),
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.problem_type,
      c.location_type === 'common_area' 
        ? c.common_area || ''
        : c.location_type === 'high_rise'
          ? `High Rise - Tower ${c.tower}, Flat ${c.flat}`
          : `Low Rise - ${c.tower}, Flat ${c.flat}`,
      c.official_priority || c.suggested_priority,
      c.status,
      new Date(c.created_at).toLocaleDateString(),
      c.due_date ? new Date(c.due_date).toLocaleDateString() : '',
    ]);
    
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaints-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">All Complaints</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} complaint{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | '')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolution_submitted">Resolution Submitted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="rework_requested">Rework Requested</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 outline-none"
          >
            <option value="">All Categories</option>
            {COMPLAINT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-navy-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <p className="text-slate-500 text-sm">No complaints found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">#{c.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium text-navy-800 max-w-[200px] truncate">{c.title}</td>
                    <td className="px-4 py-3 text-slate-600">{c.category}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {c.location_type === 'common_area' 
                        ? c.common_area 
                        : c.location_type === 'high_rise' 
                          ? `HR-T${c.tower}-${c.flat}`
                          : `LR-${c.tower}-${c.flat}`}
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.official_priority || c.suggested_priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/complaints/${c.id}`} className="text-navy-600 hover:text-navy-800 text-xs font-medium">
                        View
                      </Link>
                    </td>
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
