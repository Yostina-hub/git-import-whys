-- Create storage buckets for different types of files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('patient-documents', 'patient-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('patient-images', 'patient-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/gif']),
  ('consent-signatures', 'consent-signatures', false, 1048576, ARRAY['image/png', 'image/jpeg']),
  ('profile-avatars', 'profile-avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/jpg']);

-- Storage policies for patient documents (private - only accessible to staff)
CREATE POLICY "Staff can view patient documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-documents' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'clinician'::app_role) OR 
   has_role(auth.uid(), 'reception'::app_role) OR
   has_role(auth.uid(), 'billing'::app_role) OR
   has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Staff can upload patient documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-documents' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'clinician'::app_role) OR 
   has_role(auth.uid(), 'reception'::app_role))
);

CREATE POLICY "Staff can delete patient documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-documents' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'clinician'::app_role))
);

-- Storage policies for patient images (private)
CREATE POLICY "Staff can view patient images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-images' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'clinician'::app_role) OR 
   has_role(auth.uid(), 'reception'::app_role) OR
   has_role(auth.uid(), 'manager'::app_role))
);

CREATE POLICY "Staff can upload patient images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-images' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'clinician'::app_role) OR 
   has_role(auth.uid(), 'reception'::app_role))
);

CREATE POLICY "Staff can delete patient images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-images' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'clinician'::app_role))
);

-- Storage policies for consent signatures (private)
CREATE POLICY "Staff can view consent signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'consent-signatures' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'clinician'::app_role) OR 
   has_role(auth.uid(), 'reception'::app_role))
);

CREATE POLICY "Staff can upload consent signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'consent-signatures' AND
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'clinician'::app_role) OR 
   has_role(auth.uid(), 'reception'::app_role))
);

-- Storage policies for profile avatars (public bucket - anyone can view)
CREATE POLICY "Anyone can view profile avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create document_attachments table to track uploaded files
CREATE TABLE public.document_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  bucket_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'lab_result', 'imaging', 'consent', 'referral', 'prescription', 'other'
  document_date DATE,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.document_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_attachments
CREATE POLICY "Staff can view document attachments"
ON public.document_attachments FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'clinician'::app_role) OR 
  has_role(auth.uid(), 'reception'::app_role) OR 
  has_role(auth.uid(), 'billing'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Staff can create document attachments"
ON public.document_attachments FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'clinician'::app_role) OR 
  has_role(auth.uid(), 'reception'::app_role)
);

CREATE POLICY "Staff can update document attachments"
ON public.document_attachments FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'clinician'::app_role)
);

CREATE POLICY "Staff can delete document attachments"
ON public.document_attachments FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'clinician'::app_role)
);

-- Add updated_at trigger
CREATE TRIGGER update_document_attachments_updated_at
BEFORE UPDATE ON public.document_attachments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_document_attachments_patient_id ON public.document_attachments(patient_id);
CREATE INDEX idx_document_attachments_document_type ON public.document_attachments(document_type);
CREATE INDEX idx_document_attachments_created_at ON public.document_attachments(created_at DESC);