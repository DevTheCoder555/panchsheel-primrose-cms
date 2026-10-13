import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { PRIORITY_CONFIG } from '../../lib/constants';
import type { Complaint, Profile, ComplaintImage } from '../../types';

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [resident, setResident] = useState<Profile | null>(null);
  const [assignee, setAssignee] = useState<Profile | null>(null);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [images, setImages] = useState<ComplaintImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [showRework, setShowRework] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [newPriority, setNewPriority] = useState<string>('');

  useEffect(() => { if (id) loadComplaint(id); }, [id]);

  async function loadComplaint(complaintId: string) {
    setLoading(true);
    const { data: c } = await supabase.from('complaints').select('*').eq('id', complaintId).single();
    if (c) {
      setComplaint(c);
      setNewPriority(c.official_priority || c.suggested_priority);
      const [res, imgs] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', c.resident_id).single(),
        supabase.from('complaint_images').select('*').eq('complaint_id', complaintId),
      ]);
      if (res.data) setResident(res.data);
      if (c.assigned_to) {
        const { data: a } = await supabase.from('profiles').select('*').eq('id', c.assigned_to).single();
        if (a) setAssignee(a);
      }
      if (imgs.data) {
        // Get signed URLs
        const withUrls = await Promise.all(imgs.data.map(async (img: Record<string, unknown>) => {
          const { data: urlData } = await supabase.storage.from('complaint-images').createSignedUrl(img.image_path as string, 3600);
          return { ...img, signed_url: urlData?.signedUrl || '' } as ComplaintImage;
        }));
        setImages(withUrls);
      }
    }
    // Load maintenance staff for assignment
    const { data: staffData } = await supabase.from('profiles').select('*').eq('role', 'maintenance');
    if (staffData) setStaff(staffData);
    setLoading(false);
  }

  async function acceptComplaint() {
    if (!complaint || !profile) return;
    setActionLoading(true);
    const updates: Partial<Complaint> = { status: 'accepted', accepted_at: new Date().toISOString() };
    if (newPriority && newPriority !== complaint.suggested_priority) {
      updates.official_priority = newPriority as Complaint['official_priority'];
    }
    await supabase.from('complaints').update(updates).eq('id', complaint.id);
    await logActivity(complaint.id, 'accepted', profile.id, `Priority set to ${newPriority || complaint.suggested_priority}`);
    await loadComplaint(complaint.id);
    setActionLoading(false);
  }

  async function rejectComplaint() {
    if (!complaint || !profile || !reason.trim()) return;
    setActionLoading(true);
    await supabase.from('complaints').update({ status: 'rejected', rejection_reason: reason }).eq('id', complaint.id);
    await logActivity(complaint.id, 'rejected', profile.id, reason);
    setShowReject(false);
    setReason('');
    await loadComplaint(complaint.id);
    setActionLoading(false);
  }

  async function assignComplaint() {
    if (!complaint || !profile || !selectedStaff) return;
    setActionLoading(true);
    await supabase.from('complaints').update({ status: 'assigned', assigned_to: selectedStaff, assigned_at: new Date().toISOString() }).eq('id', complaint.id);
    await logActivity(complaint.id, 'assigned', profile.id, `Assigned to staff ${selectedStaff}`);
    setShowAssign(false);
    await loadComplaint(complaint.id);
    setActionLoading(false);
  }

  async function approveCompletion() {
    if (!complaint || !profile) return;
    setActionLoading(true);
    await supabase.from('complaints').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', complaint.id);
    await logActivity(complaint.id, 'completed', profile.id, 'Resolution approved by admin');
    await loadComplaint(complaint.id);
    setActionLoading(false);
  }

  async function requestRework() {
    if (!complaint || !profile || !reason.trim()) return;
    setActionLoading(true);
    await supabase.from('complaints').update({ status: 'rework_requested', rework_reason: reason }).eq('id', complaint.id);
    await logActivity(complaint.id, 'rework_requested', profile.id, reason);
    setShowRework(false);
    setReason('');
    await loadComplaint(complaint.id);
    setActionLoading(false);
  }

  async function reopenComplaint() {
    if (!complaint || !profile) return;
    setActionLoading(true);
    await supabase.from('complaints').update({ status: 'accepted', rework_reason: null, rejection_reason: null }).eq('id', complaint.id);
    await logActivity(complaint.id, 'reopened', profile.id, 'Complaint reopened by admin');
    await loadComplaint(complaint.id);
    setActionLoading(false);
  }

  async function logActivity(complaintId: string, action: string, performedBy: string, details?: string) {
    await supabase.from('activity_logs').insert({ complaint_id: complaintId, action, performed_by: performedBy, details });
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-navy-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!complaint) {
    return <div className="text-center py-20 text-slate-500">Complaint not found</div>;
  }

  const problemImages = images.filter((i) => i.image_type === 'problem');
  const resolutionImages = images.filter((i) => i.image_type === 'resolution');

  const btnClass = "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-navy-700 mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-navy-800">{complaint.title}</h1>
              <StatusBadge status={complaint.status} />
            </div>
            <p className="text-slate-500 text-sm">#{complaint.id.slice(0, 8)} | Filed {new Date(complaint.created_at).toLocaleString()}</p>
          </div>
          <PriorityBadge priority={complaint.official_priority || complaint.suggested_priority} />
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-navy-800 mb-3">Complaint Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Category</dt><dd className="font-medium">{complaint.category}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Problem Type</dt><dd className="font-medium">{complaint.problem_type}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd className="font-medium">{complaint.location_type === 'common_area' ? complaint.common_area : `Tower ${complaint.tower}, Flat ${complaint.flat}`}</dd></div>
            {complaint.required_technician && <div className="flex justify-between"><dt className="text-slate-500">Required Technician</dt><dd className="font-medium">{complaint.required_technician}</dd></div>}
            <div className="flex justify-between"><dt className="text-slate-500">Suggested Priority</dt><dd><PriorityBadge priority={complaint.suggested_priority} /></dd></div>
            {complaint.official_priority && <div className="flex justify-between"><dt className="text-slate-500">Official Priority</dt><dd><PriorityBadge priority={complaint.official_priority} /></dd></div>}
          </dl>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-slate-500 text-xs mb-1">Description</p>
            <p className="text-sm text-slate-700">{complaint.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-navy-800 mb-3">People</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500 text-xs">Resident</dt>
              <dd className="font-medium">{resident?.full_name || 'Unknown'}</dd>
              <dd className="text-slate-500 text-xs">{resident?.email} {resident?.phone ? `| ${resident.phone}` : ''}</dd>
              {resident?.tower && <dd className="text-slate-500 text-xs">Tower {resident.tower}, Flat {resident.flat}</dd>}
            </div>
            {assignee && (
              <div>
                <dt className="text-slate-500 text-xs">Assigned To</dt>
                <dd className="font-medium">{assignee.full_name}</dd>
                <dd className="text-slate-500 text-xs">{assignee.email}</dd>
              </div>
            )}
          </dl>

          {complaint.rejection_reason && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-red-600 text-xs font-medium mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{complaint.rejection_reason}</p>
            </div>
          )}
          {complaint.rework_reason && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-rose-600 text-xs font-medium mb-1">Rework Reason</p>
              <p className="text-sm text-rose-700">{complaint.rework_reason}</p>
            </div>
          )}
          {complaint.resolution_notes && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-teal-600 text-xs font-medium mb-1">Resolution Notes</p>
              <p className="text-sm text-slate-700">{complaint.resolution_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Images */}
      {problemImages.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="font-semibold text-navy-800 mb-3">Problem Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {problemImages.map((img) => (
              <a key={img.id} href={img.signed_url} target="_blank" rel="noopener noreferrer">
                <img src={img.signed_url} alt="Problem" className="w-full h-24 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition" />
              </a>
            ))}
          </div>
        </div>
      )}

      {resolutionImages.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="font-semibold text-navy-800 mb-3">Resolution Proof Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {resolutionImages.map((img) => (
              <a key={img.id} href={img.signed_url} target="_blank" rel="noopener noreferrer">
                <img src={img.signed_url} alt="Resolution" className="w-full h-24 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-navy-800 mb-4">Actions</h3>

        {/* Priority override for accepted/under_review */}
        {['submitted', 'under_review', 'accepted'].includes(complaint.status) && (
          <div className="mb-4">
            <label className="block text-sm text-slate-600 mb-1">Set Official Priority</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {(Object.entries(PRIORITY_CONFIG) as [string, { label: string }][]).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {complaint.status === 'submitted' && (
            <>
              <button onClick={acceptComplaint} disabled={actionLoading} className={`${btnClass} bg-green-600 text-white hover:bg-green-700`}>Accept Complaint</button>
              <button onClick={() => setShowReject(true)} className={`${btnClass} bg-red-600 text-white hover:bg-red-700`}>Reject</button>
            </>
          )}
          {complaint.status === 'accepted' && (
            <button onClick={() => setShowAssign(true)} className={`${btnClass} bg-navy-700 text-white hover:bg-navy-800`}>Assign Staff</button>
          )}
          {complaint.status === 'resolution_submitted' && (
            <>
              <button onClick={approveCompletion} disabled={actionLoading} className={`${btnClass} bg-green-600 text-white hover:bg-green-700`}>Approve & Complete</button>
              <button onClick={() => setShowRework(true)} className={`${btnClass} bg-rose-600 text-white hover:bg-rose-700`}>Request Rework</button>
            </>
          )}
          {['rejected', 'completed'].includes(complaint.status) && (
            <button onClick={reopenComplaint} disabled={actionLoading} className={`${btnClass} bg-amber-600 text-white hover:bg-amber-700`}>Reopen Complaint</button>
          )}
        </div>

        {/* Reject modal */}
        {showReject && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <label className="block text-sm font-medium text-red-800 mb-2">Rejection Reason (required)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm" placeholder="Explain why this complaint is being rejected..." />
            <div className="flex gap-2 mt-2">
              <button onClick={rejectComplaint} disabled={!reason.trim() || actionLoading} className={`${btnClass} bg-red-600 text-white hover:bg-red-700`}>Confirm Rejection</button>
              <button onClick={() => { setShowReject(false); setReason(''); }} className={`${btnClass} bg-white border border-slate-300 text-slate-700 hover:bg-slate-50`}>Cancel</button>
            </div>
          </div>
        )}

        {/* Rework modal */}
        {showRework && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <label className="block text-sm font-medium text-rose-800 mb-2">Rework Reason (required)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-rose-300 rounded-lg text-sm" placeholder="Explain what needs to be redone..." />
            <div className="flex gap-2 mt-2">
              <button onClick={requestRework} disabled={!reason.trim() || actionLoading} className={`${btnClass} bg-rose-600 text-white hover:bg-rose-700`}>Request Rework</button>
              <button onClick={() => { setShowRework(false); setReason(''); }} className={`${btnClass} bg-white border border-slate-300 text-slate-700 hover:bg-slate-50`}>Cancel</button>
            </div>
          </div>
        )}

        {/* Assign modal */}
        {showAssign && (
          <div className="mt-4 p-4 bg-navy-50 border border-navy-200 rounded-lg">
            <label className="block text-sm font-medium text-navy-800 mb-2">Assign to Maintenance Staff</label>
            <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="w-full px-3 py-2 border border-navy-300 rounded-lg text-sm mb-2">
              <option value="">Select staff member...</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={assignComplaint} disabled={!selectedStaff || actionLoading} className={`${btnClass} bg-navy-700 text-white hover:bg-navy-800`}>Assign</button>
              <button onClick={() => setShowAssign(false)} className={`${btnClass} bg-white border border-slate-300 text-slate-700 hover:bg-slate-50`}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
