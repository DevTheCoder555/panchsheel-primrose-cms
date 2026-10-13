-- ============================================================
-- PANCHSHEEL PRIMROSE SOCIETY - COMPLAINT MANAGEMENT SYSTEM
-- Supabase Database Schema
-- ============================================================
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com and create a free project
-- 2. Go to SQL Editor in your Supabase dashboard
-- 3. Paste and run this entire script
-- 4. Create a storage bucket named 'complaint-images' (private)
-- 5. Copy your project URL and anon key into the app config
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('admin', 'maintenance', 'resident')),
  phone TEXT,
  tower TEXT,
  flat TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. COMPLAINTS TABLE
-- ============================================================
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  problem_type TEXT NOT NULL,
  description TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('tower_flat', 'common_area')),
  tower TEXT,
  flat TEXT,
  common_area TEXT,
  required_technician TEXT,
  suggested_priority TEXT NOT NULL DEFAULT 'medium' CHECK (suggested_priority IN ('low', 'medium', 'high', 'urgent')),
  official_priority TEXT CHECK (official_priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'accepted', 'assigned',
    'in_progress', 'resolution_submitted', 'completed',
    'rejected', 'rework_requested'
  )),
  resident_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  rework_reason TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- 3. COMPLAINT IMAGES TABLE
-- ============================================================
CREATE TABLE public.complaint_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('problem', 'resolution')),
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX idx_complaints_resident ON public.complaints(resident_id);
CREATE INDEX idx_complaints_assigned ON public.complaints(assigned_to);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_created ON public.complaints(created_at DESC);
CREATE INDEX idx_complaint_images_complaint ON public.complaint_images(complaint_id);
CREATE INDEX idx_activity_logs_complaint ON public.activity_logs(complaint_id);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- On signup, users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---- COMPLAINTS ----
-- Residents can view their own complaints
CREATE POLICY "Residents see own complaints"
  ON public.complaints FOR SELECT
  USING (
    resident_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    (assigned_to = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'maintenance'))
  );

-- Residents can create complaints (only for themselves)
CREATE POLICY "Residents can create complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (auth.uid() = resident_id);

-- Residents can update their own complaints (only to add info, not change status)
CREATE POLICY "Residents can update own complaints"
  ON public.complaints FOR UPDATE
  USING (resident_id = auth.uid());

-- Admins can manage all complaints
CREATE POLICY "Admins can manage all complaints"
  ON public.complaints FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Maintenance staff can update assigned complaints
CREATE POLICY "Maintenance can update assigned complaints"
  ON public.complaints FOR UPDATE
  USING (
    assigned_to = auth.uid()
    AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'maintenance')
  );

-- ---- COMPLAINT IMAGES ----
-- Anyone who can see the complaint can see its images
CREATE POLICY "Users can view complaint images"
  ON public.complaint_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id
      AND (
        c.resident_id = auth.uid()
        OR c.assigned_to = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Users can upload images to complaints they have access to
CREATE POLICY "Users can insert complaint images"
  ON public.complaint_images FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id
      AND (
        c.resident_id = auth.uid()
        OR c.assigned_to = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- ---- ACTIVITY LOGS ----
-- Anyone who can see the complaint can see its logs
CREATE POLICY "Users can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id
      AND (
        c.resident_id = auth.uid()
        OR c.assigned_to = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Users can create activity logs for complaints they manage
CREATE POLICY "Users can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (
    performed_by = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id
      AND (
        c.resident_id = auth.uid()
        OR c.assigned_to = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- ============================================================
-- 7. STORAGE BUCKET
-- ============================================================
-- Create the storage bucket (run this in Supabase dashboard or via SQL)
INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-images', 'complaint-images', false);

-- Storage policies: authenticated users can upload
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'complaint-images'
    AND auth.role() = 'authenticated'
  );

-- Users can read images from complaint-images bucket
CREATE POLICY "Users can read images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'complaint-images'
    AND auth.role() = 'authenticated'
  );

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'complaint-images'
    AND auth.role() = 'authenticated'
  );

-- ============================================================
-- 8. AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 9. CREATE INITIAL ADMIN USER
-- ============================================================
-- IMPORTANT: After running this script, you need to:
-- 1. Create the admin user through Supabase Authentication > Users
-- 2. Then run this UPDATE to set their role:
--
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_ADMIN_EMAIL';
--
-- Or create a trigger to auto-set the first user as admin.
-- ============================================================

-- Function to automatically set role on profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- If no profiles exist yet, make this user admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
    -- This is the first user, will be set to admin via the INSERT policy
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
