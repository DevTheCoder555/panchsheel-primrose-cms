import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import ImageUpload from '../../components/ImageUpload';
import type { Complaint, ComplaintImage } from '../../types';

export default function MaintenanceDashboard() {
  const { profile, user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ComplaintImage[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadTasks(); }, []);
  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId]);

  async function loadTasks() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('complaints').select('*').eq('assigned_to', user.id).order('created_at', { ascending: false });
    setComplaints(data || []);
    setLoading(false);
  }

  async function loadDetail(complaintId: string) {
    const { data: c } = await supabase.from('complaints').select('*').eq('id', complaintId).single();
    setSelected(c);
    if (c) {
      setResolutionNotes(c.resolution_notes || '');
      const { data: imgs } = await supabase.from('complaint_images').select('*').eq('complaint_id', complaintId);
      if (imgs) {
        const withUrls = await Promise.all(imgs.map(async (img) => {
          const { data: urlData } = await supabase.storage.from('complaint-images').createSignedUrl(img.image_path, 3600);
          return { ...img, signed_url: urlData?.signedUrl || '' };
        }));
        setExistingImages(withUrls);
      }
    }
  }

  async function startWork() {
    if (!selected) return;
    setActionLoading(true);
    await supabase.from('complaints').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', selected.id);
    await loadTasks();
    await loadDetail(selected.id);
    setActionLoading(false);
  }

  async function submitResolution() {
    if (!selected || !user) return;
    if (images.length === 0) { setError('At least one resolution proof image is required'); return; }
    if (!resolutionNotes.trim()) { setError('Resolution notes are required'); return; }
    setError('');
    setActionLoading(true);

    // Upload images
    for (const file of images) {
      const ext = file.name.split('.').pop();
      const path = `${selected.id}/resolution/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('complaint-images').upload(path, file);
      if (uploadError) { setError('Image upload failed: ' + uploadError.message); setActionLoading(false); return; }
      await supabase.from('complaint_images').insert({ complaint_id: selected.id, image_path: path, image_type: 'resolution', uploaded_by: user.id });
    }

    await supabase.from('complaints').update({ status: 'resolution_submitted', resolution_notes: resolutionNotes }).eq('id', selected.id);
    setImages([]);
    await loadTasks();
    await loadDetail(selected.id);
    setActionLoading(false);
  }

  async function returnTask() {
    if (!selected || !returnReason.trim()) return;
    setActionLoading(true);
    await supabase.from('complaints').update({ status: 'accepted', assigned_to: null, assigned_at: null }).eq('id', selected.id);
    await supabase.from('activity_logs').insert({ complaint_id: selected.id, action: 'returned_by_staff', performed_by: user!.id, details: returnReason });
    setShowReturn(false);
    setReturnReason('');
    setSelectedId(null);
    await loadTasks();
    setActionLoading(false);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-navy-600 border-t-transparent rounded-full animate-spin" /></div>;

  const myTasks = complaints;
  const activeTasks = myTasks.filter((c) => ['assigned', 'in_progress'].includes(c.status));
  const completedTasks = myTasks.filter((c) => ['completed', 'resolution_submitted'].includes(c.status));
  // returnedTasks: tasks returned by staff back to admin queue
  void myTasks.filter((c) => c.status === 'accepted' && !c.assigned_to);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800">My Tasks</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome, {profile?.full_name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{activeTasks.length}</p>
          <p className="text-xs text-slate-500">Active</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-600">{myTasks.length}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task list */}
        <div>
          <h2 className="font-semibold text-navy-800 mb-3">Assigned Tasks</h2>
          {myTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">No tasks assigned yet</div>
          ) : (
            <div className="space-y-2">
              {myTasks.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`bg-white rounded-lg border p-4 cursor-pointer transition ${selectedId === c.id ? 'border-navy-400 ring-1 ring-navy-200' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-navy-800 text-sm truncate">{c.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.category} | {c.location_type === 'common_area' ? c.common_area : c.location_type === 'high_rise' ? `HR-T${c.tower}-${c.flat}` : `LR-${c.tower}-${c.flat}`}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.official_priority || c.suggested_priority} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task detail */}
        <div>
          {!selected ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">Select a task to view details</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-2 mb-4">
                <h3 className="font-semibold text-navy-800">{selected.title}</h3>
                <StatusBadge status={selected.status} />
              </div>

              <dl className="space-y-1.5 text-sm mb-4">
                <div className="flex justify-between"><dt className="text-slate-500">Category</dt><dd>{selected.category} - {selected.problem_type}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd>{selected.location_type === 'common_area' ? selected.common_area : selected.location_type === 'high_rise' ? `High Rise - Tower ${selected.tower}, Flat ${selected.flat}` : `Low Rise - ${selected.tower}, Flat ${selected.flat}`}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Priority</dt><dd><PriorityBadge priority={selected.official_priority || selected.suggested_priority} /></dd></div>
              </dl>

              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selected.description}</p>
              </div>

              {/* Problem images */}
              {existingImages.filter((i) => i.image_type === 'problem').length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Problem Photos</p>
                  <div className="flex gap-2 flex-wrap">
                    {existingImages.filter((i) => i.image_type === 'problem').map((img) => (
                      <a key={img.id} href={img.signed_url} target="_blank" rel="noopener noreferrer">
                        <img src={img.signed_url} alt="" className="w-16 h-16 object-cover rounded border" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions based on status */}
              {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">{error}</div>}

              {selected.status === 'assigned' && (
                <div className="flex gap-2">
                  <button onClick={startWork} disabled={actionLoading} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">Start Work</button>
                  <button onClick={() => setShowReturn(true)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50">Return Task</button>
                </div>
              )}

              {selected.status === 'in_progress' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Resolution Notes *</label>
                    <textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Describe the work done..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Upload Proof Images * (at least 1)</label>
                    <ImageUpload onFileSelect={(file) => setImages((prev) => [...prev, file])} label="Upload completion proof" />
                    {images.length > 0 && <p className="text-xs text-green-600 mt-1">{images.length} image(s) selected</p>}
                  </div>
                  <button onClick={submitResolution} disabled={actionLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">Submit Resolution</button>
                </div>
              )}

              {selected.status === 'rework_requested' && (
                <div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg mb-3">
                    <p className="text-xs font-medium text-rose-700 mb-1">Rework Reason</p>
                    <p className="text-sm text-rose-800">{selected.rework_reason}</p>
                  </div>
                  <button onClick={startWork} disabled={actionLoading} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">Start Rework</button>
                </div>
              )}

              {selected.status === 'resolution_submitted' && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-sm text-teal-700">Resolution submitted. Waiting for admin verification.</p>
                </div>
              )}

              {selected.status === 'completed' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">Task completed and approved.</p>
                </div>
              )}

              {/* Return modal */}
              {showReturn && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="block text-sm font-medium text-amber-800 mb-1">Return Reason (required)</label>
                  <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} rows={2} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm" placeholder="Explain why you are returning this task..." />
                  <div className="flex gap-2 mt-2">
                    <button onClick={returnTask} disabled={!returnReason.trim() || actionLoading} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-50">Confirm Return</button>
                    <button onClick={() => { setShowReturn(false); setReturnReason(''); }} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
