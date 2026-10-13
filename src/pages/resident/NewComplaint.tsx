import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ImageUpload from '../../components/ImageUpload';
import { COMPLAINT_CATEGORIES, PROBLEM_TYPES, TOWERS, COMMON_AREAS, PRIORITY_CONFIG } from '../../lib/constants';
import type { Priority } from '../../types';

export default function NewComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);

  const [form, setForm] = useState({
    title: '',
    category: '',
    problem_type: '',
    description: '',
    location_type: 'tower_flat' as 'tower_flat' | 'common_area',
    tower: '',
    flat: '',
    common_area: '',
    required_technician: '',
    suggested_priority: 'medium' as Priority,
  });

  function update(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'category') next.problem_type = '';
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    const { data: complaint, error: cError } = await supabase
      .from('complaints')
      .insert({
        title: form.title,
        category: form.category,
        problem_type: form.problem_type,
        description: form.description,
        location_type: form.location_type,
        tower: form.location_type === 'tower_flat' ? form.tower : null,
        flat: form.location_type === 'tower_flat' ? form.flat : null,
        common_area: form.location_type === 'common_area' ? form.common_area : null,
        required_technician: form.required_technician || null,
        suggested_priority: form.suggested_priority,
        resident_id: user.id,
        status: 'submitted',
      })
      .select()
      .single();

    if (cError || !complaint) {
      setError('Failed to submit complaint: ' + (cError?.message || 'Unknown error'));
      setLoading(false);
      return;
    }

    // Upload images
    for (const file of images) {
      const ext = file.name.split('.').pop();
      const path = `${complaint.id}/problem/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('complaint-images').upload(path, file);
      if (!uploadError) {
        await supabase.from('complaint_images').insert({ complaint_id: complaint.id, image_path: path, image_type: 'problem', uploaded_by: user.id });
      }
    }

    setLoading(false);
    navigate('/resident/complaints');
  }

  const inputClass = "w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none transition";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy-800 mb-1">Submit New Complaint</h1>
      <p className="text-slate-500 text-sm mb-6">Describe your issue and we'll get it resolved</p>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-navy-800 mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} required className={inputClass} placeholder="Brief summary of the issue" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category *</label>
                <select value={form.category} onChange={(e) => update('category', e.target.value)} required className={inputClass}>
                  <option value="">Select category</option>
                  {COMPLAINT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Problem Type *</label>
                <select value={form.problem_type} onChange={(e) => update('problem_type', e.target.value)} required className={inputClass} disabled={!form.category}>
                  <option value="">Select type</option>
                  {(PROBLEM_TYPES[form.category] || []).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Description *</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} required rows={4} className={inputClass} placeholder="Describe the problem in detail..." />
            </div>
            <div>
              <label className={labelClass}>Suggested Priority</label>
              <div className="flex gap-2">
                {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update('suggested_priority', key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${form.suggested_priority === key ? `${val.bg} ${val.color} border-current` : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-navy-800 mb-4">Location</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <button type="button" onClick={() => update('location_type', 'tower_flat')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${form.location_type === 'tower_flat' ? 'bg-navy-50 text-navy-700 border-navy-300' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}>
                Tower / Flat
              </button>
              <button type="button" onClick={() => update('location_type', 'common_area')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${form.location_type === 'common_area' ? 'bg-navy-50 text-navy-700 border-navy-300' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}>
                Common Area
              </button>
            </div>
            {form.location_type === 'tower_flat' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tower *</label>
                  <select value={form.tower} onChange={(e) => update('tower', e.target.value)} required className={inputClass}>
                    <option value="">Select</option>
                    {TOWERS.map((t) => <option key={t} value={t}>Tower {t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Flat No. *</label>
                  <input type="text" value={form.flat} onChange={(e) => update('flat', e.target.value)} required className={inputClass} placeholder="e.g. 302" />
                </div>
              </div>
            ) : (
              <div>
                <label className={labelClass}>Common Area *</label>
                <select value={form.common_area} onChange={(e) => update('common_area', e.target.value)} required className={inputClass}>
                  <option value="">Select area</option>
                  {COMMON_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Technician & Photos */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-navy-800 mb-4">Additional Details</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Required Technician (optional)</label>
              <input type="text" value={form.required_technician} onChange={(e) => update('required_technician', e.target.value)} className={inputClass} placeholder="e.g. Electrician, Plumber" />
            </div>
            <div>
              <label className={labelClass}>Problem Photos (optional)</label>
              <ImageUpload
                onFileSelect={(file) => setImages((prev) => [...prev, file])}
                label="Upload photos of the problem"
              />
              {images.length > 0 && <p className="text-xs text-green-600 mt-1">{images.length} image(s) selected</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-navy-700 text-white rounded-lg text-sm font-medium hover:bg-navy-800 disabled:opacity-50 transition">
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
          <button type="button" onClick={() => navigate('/resident')} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
