import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import type { Complaint, ComplaintImage } from '../../types';

export default function MyComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, ComplaintImage[]>>({});

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from('complaints').select('*').eq('resident_id', user.id).order('created_at', { ascending: false });
      setComplaints(data || []);
      setLoading(false);
    })();
  }, [user]);

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!images[id]) {
      const { data } = await supabase.from('complaint_images').select('*').eq('complaint_id', id);
      if (data) {
        const withUrls = await Promise.all(data.map(async (img) => {
          const { data: urlData } = await supabase.storage.from('complaint-images').createSignedUrl(img.image_path, 3600);
          return { ...img, signed_url: urlData?.signedUrl || '' };
        }));
        setImages((prev) => ({ ...prev, [id]: withUrls }));
      }
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-navy-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-800 mb-1">My Complaints</h1>
      <p className="text-slate-500 text-sm mb-6">{complaints.length} complaint{complaints.length !== 1 ? 's' : ''} filed</p>

      {complaints.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No complaints filed yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const expanded = expandedId === c.id;
            const cImages = images[c.id] || [];
            const problemImgs = cImages.filter((i) => i.image_type === 'problem');
            const resolutionImgs = cImages.filter((i) => i.image_type === 'resolution');

            return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div onClick={() => toggleExpand(c.id)} className="px-5 py-4 cursor-pointer hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-navy-800">{c.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {c.category} | {c.location_type === 'common_area' ? c.common_area : `Tower ${c.tower}, Flat ${c.flat}`} | {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PriorityBadge priority={c.official_priority || c.suggested_priority} />
                      <StatusBadge status={c.status} />
                      <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                {expanded && (
                  <div className="px-5 pb-4 border-t border-slate-100 pt-4 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Description</p>
                      <p className="text-sm text-slate-700">{c.description}</p>
                    </div>

                    {c.rejection_reason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
                        <p className="text-sm text-red-800">{c.rejection_reason}</p>
                      </div>
                    )}

                    {c.rework_reason && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                        <p className="text-xs font-medium text-rose-700 mb-1">Rework Requested</p>
                        <p className="text-sm text-rose-800">{c.rework_reason}</p>
                      </div>
                    )}

                    {c.resolution_notes && (
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <p className="text-xs font-medium text-teal-700 mb-1">Resolution Notes</p>
                        <p className="text-sm text-teal-800">{c.resolution_notes}</p>
                      </div>
                    )}

                    {problemImgs.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Submitted Photos</p>
                        <div className="flex gap-2 flex-wrap">
                          {problemImgs.map((img) => (
                            <a key={img.id} href={img.signed_url} target="_blank" rel="noopener noreferrer">
                              <img src={img.signed_url} alt="" className="w-20 h-20 object-cover rounded border" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {resolutionImgs.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Resolution Proof</p>
                        <div className="flex gap-2 flex-wrap">
                          {resolutionImgs.map((img) => (
                            <a key={img.id} href={img.signed_url} target="_blank" rel="noopener noreferrer">
                              <img src={img.signed_url} alt="" className="w-20 h-20 object-cover rounded border" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="pt-2">
                      <p className="text-xs text-slate-500 mb-2">Timeline</p>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <p>Submitted: {new Date(c.created_at).toLocaleString()}</p>
                        {c.accepted_at && <p>Accepted: {new Date(c.accepted_at).toLocaleString()}</p>}
                        {c.assigned_at && <p>Assigned: {new Date(c.assigned_at).toLocaleString()}</p>}
                        {c.started_at && <p>Work Started: {new Date(c.started_at).toLocaleString()}</p>}
                        {c.completed_at && <p>Completed: {new Date(c.completed_at).toLocaleString()}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
