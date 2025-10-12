-- Phase 2: Clinical Core Tables

-- ============================================
-- 1. ADDITIONAL ENUMS
-- ============================================

-- Consent types
CREATE TYPE public.consent_type AS ENUM (
  'general_treatment', 'data_privacy', 'photography', 
  'telehealth', 'package_treatment', 'research'
);

-- Assessment stages
CREATE TYPE public.assessment_stage AS ENUM ('S1', 'S2', 'S3', 'SA_online');

-- Protocol status
CREATE TYPE public.protocol_status AS ENUM (
  'draft', 'active', 'on_hold', 'completed', 'cancelled'
);

-- Note types
CREATE TYPE public.note_type AS ENUM (
  'subjective', 'objective', 'assessment', 'plan', 
  'discharge', 'admin', 'follow_up', 'message'
);

-- ============================================
-- 2. CONSENT FORMS TABLE
-- ============================================

CREATE TABLE public.consent_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  consent_type public.consent_type NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  content_html TEXT,
  signed_at TIMESTAMPTZ,
  signed_by TEXT, -- 'patient' or 'guardian'
  signature_blob TEXT,
  witness_id UUID REFERENCES auth.users(id),
  captured_channel TEXT DEFAULT 'emr_app',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consent_patient ON public.consent_forms(patient_id);

ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view consent forms"
  ON public.consent_forms FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'reception') OR
    has_role(auth.uid(), 'clinician') OR
    has_role(auth.uid(), 'billing')
  );

CREATE POLICY "Staff can create consent forms"
  ON public.consent_forms FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'reception') OR
    has_role(auth.uid(), 'clinician')
  );

-- ============================================
-- 3. ASSESSMENT TEMPLATES TABLE
-- ============================================

CREATE TABLE public.assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stage public.assessment_stage NOT NULL,
  schema JSONB NOT NULL DEFAULT '{"fields": []}',
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view templates"
  ON public.assessment_templates FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage templates"
  ON public.assessment_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. ASSESSMENTS TABLE
-- ============================================

CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  assessment_stage public.assessment_stage NOT NULL,
  template_id UUID REFERENCES public.assessment_templates(id) NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  score DECIMAL(6,2),
  flags JSONB DEFAULT '{}',
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessment_patient ON public.assessments(patient_id);
CREATE INDEX idx_assessment_appointment ON public.assessments(appointment_id);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view assessments"
  ON public.assessments FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician') OR
    has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Clinicians can create assessments"
  ON public.assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician')
  );

CREATE POLICY "Clinicians can update assessments"
  ON public.assessments FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician')
  );

-- ============================================
-- 5. TREATMENT PROTOCOLS TABLE
-- ============================================

CREATE TABLE public.treatment_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  created_from_assessment_id UUID REFERENCES public.assessments(id),
  name TEXT NOT NULL,
  is_optional BOOLEAN DEFAULT FALSE,
  goals TEXT,
  plan JSONB NOT NULL DEFAULT '{"sessions": []}',
  attachments JSONB DEFAULT '[]',
  status public.protocol_status DEFAULT 'draft',
  owner_provider_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_protocol_patient ON public.treatment_protocols(patient_id);

ALTER TABLE public.treatment_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view protocols"
  ON public.treatment_protocols FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician') OR
    has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Clinicians can create protocols"
  ON public.treatment_protocols FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician')
  );

CREATE POLICY "Clinicians can update protocols"
  ON public.treatment_protocols FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician')
  );

-- ============================================
-- 6. TREATMENT SESSIONS (Clinical Encounters)
-- ============================================

CREATE TABLE public.treatment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID REFERENCES public.treatment_protocols(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  clinician_id UUID REFERENCES auth.users(id) NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  services_rendered JSONB DEFAULT '[]',
  procedure_notes TEXT,
  vitals JSONB DEFAULT '{}',
  complications TEXT,
  consumables_used JSONB DEFAULT '[]',
  sign_off_at TIMESTAMPTZ,
  billing_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_patient ON public.treatment_sessions(patient_id);
CREATE INDEX idx_session_protocol ON public.treatment_sessions(protocol_id);

ALTER TABLE public.treatment_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view sessions"
  ON public.treatment_sessions FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician') OR
    has_role(auth.uid(), 'billing') OR
    has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Clinicians can create sessions"
  ON public.treatment_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician')
  );

CREATE POLICY "Clinicians can update sessions"
  ON public.treatment_sessions FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician')
  );

-- ============================================
-- 7. POST-TREATMENT ASSESSMENTS
-- ============================================

CREATE TABLE public.post_treatment_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.treatment_sessions(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.assessment_templates(id),
  responses JSONB NOT NULL DEFAULT '{}',
  score DECIMAL(6,2),
  outcome TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  next_appointment_id UUID REFERENCES public.appointments(id),
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.post_treatment_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view post-treatment assessments"
  ON public.post_treatment_assessments FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician') OR
    has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Clinicians can manage post-treatment assessments"
  ON public.post_treatment_assessments FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician')
  );

-- ============================================
-- 8. EMR NOTES TABLE
-- ============================================

CREATE TABLE public.emr_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  note_type public.note_type NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  visibility TEXT DEFAULT 'clinical',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emr_notes_patient ON public.emr_notes(patient_id);
CREATE INDEX idx_emr_notes_appointment ON public.emr_notes(appointment_id);

ALTER TABLE public.emr_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view emr notes"
  ON public.emr_notes FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician') OR
    has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Staff can create emr notes"
  ON public.emr_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'clinician') OR
    has_role(auth.uid(), 'reception')
  );

CREATE POLICY "Authors can update their notes"
  ON public.emr_notes FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    has_role(auth.uid(), 'admin')
  );

-- ============================================
-- 9. TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_consent_forms_updated_at
  BEFORE UPDATE ON public.consent_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_templates_updated_at
  BEFORE UPDATE ON public.assessment_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_protocols_updated_at
  BEFORE UPDATE ON public.treatment_protocols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatment_sessions_updated_at
  BEFORE UPDATE ON public.treatment_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_treatment_assessments_updated_at
  BEFORE UPDATE ON public.post_treatment_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emr_notes_updated_at
  BEFORE UPDATE ON public.emr_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 10. SEED DATA - ASSESSMENT TEMPLATES
-- ============================================

-- S3 Initial Assessment Template
INSERT INTO public.assessment_templates (name, stage, schema, version)
VALUES (
  'SONIK S3 Initial Assessment',
  'S3',
  '{
    "fields": [
      {"key": "chief_complaint", "type": "text", "label": "Chief Complaint", "required": true},
      {"key": "onset_date", "type": "date", "label": "Onset Date"},
      {"key": "pain_scale", "type": "number", "label": "Pain Scale (0-10)", "min": 0, "max": 10},
      {"key": "medical_history", "type": "textarea", "label": "Medical History"},
      {"key": "current_medications", "type": "textarea", "label": "Current Medications"},
      {"key": "allergies", "type": "text", "label": "Allergies"},
      {"key": "height_cm", "type": "number", "label": "Height (cm)"},
      {"key": "weight_kg", "type": "number", "label": "Weight (kg)"},
      {"key": "bp_systolic", "type": "number", "label": "BP Systolic"},
      {"key": "bp_diastolic", "type": "number", "label": "BP Diastolic"},
      {"key": "pulse", "type": "number", "label": "Pulse"},
      {"key": "temp_c", "type": "number", "label": "Temperature (°C)"},
      {"key": "red_flags", "type": "checkbox", "label": "Red Flags Present"},
      {"key": "clinician_summary", "type": "textarea", "label": "Clinician Summary"}
    ]
  }',
  '1.0'
);

-- Post-Treatment Assessment Template
INSERT INTO public.assessment_templates (name, stage, schema, version)
VALUES (
  'Post-Treatment Assessment',
  'S3',
  '{
    "fields": [
      {"key": "adverse_events", "type": "checkbox", "label": "Adverse Events"},
      {"key": "adverse_details", "type": "textarea", "label": "Adverse Event Details"},
      {"key": "patient_reported_outcome", "type": "number", "label": "Patient Reported Outcome (1-5)", "min": 1, "max": 5},
      {"key": "pain_scale_post", "type": "number", "label": "Pain Scale Post-Treatment (0-10)", "min": 0, "max": 10},
      {"key": "next_steps", "type": "select", "label": "Next Steps", "options": ["continue_protocol", "modify_protocol", "discharge"]},
      {"key": "clinician_notes", "type": "textarea", "label": "Clinician Notes"}
    ]
  }',
  '1.0'
);