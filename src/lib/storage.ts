import { supabase } from './supabase';

const BUCKET = 'complaint-images';

export async function uploadComplaintImage(
  file: File,
  complaintId: string,
  type: 'problem' | 'resolution',
  userId: string
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop();
  const path = `${complaintId}/${type}/${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Store reference in database (actual file stays private, we use signed URLs)
  const { error: dbError } = await supabase.from('complaint_images').insert({
    complaint_id: complaintId,
    image_path: path,
    image_type: type,
    uploaded_by: userId,
  });

  if (dbError) throw dbError;

  return { url: data.publicUrl, path };
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (error) throw error;
  return data.signedUrl;
}

export async function getComplaintImages(complaintId: string, type?: 'problem' | 'resolution') {
  let query = supabase
    .from('complaint_images')
    .select('*')
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: true });

  if (type) {
    query = query.eq('image_type', type);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Get signed URLs for all images
  const imagesWithUrls = await Promise.all(
    (data || []).map(async (img) => {
      try {
        const signedUrl = await getSignedUrl(img.image_path);
        return { ...img, signed_url: signedUrl };
      } catch {
        return { ...img, signed_url: null };
      }
    })
  );

  return imagesWithUrls;
}
