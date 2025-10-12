-- Phase 14: Advanced Clinical Features

-- Create medications table
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  prescribed_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create allergies table
CREATE TABLE public.allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  reaction TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'life-threatening')),
  onset_date DATE,
  verified_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vital_signs table
CREATE TABLE public.vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.treatment_sessions(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  temperature DECIMAL(4,1),
  temperature_unit TEXT DEFAULT 'celsius' CHECK (temperature_unit IN ('celsius', 'fahrenheit')),
  heart_rate INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  respiratory_rate INTEGER,
  oxygen_saturation INTEGER,
  weight DECIMAL(5,2),
  weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  height DECIMAL(5,2),
  height_unit TEXT DEFAULT 'cm' CHECK (height_unit IN ('cm', 'inches')),
  bmi DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medications
CREATE POLICY "Clinicians can create medications"
ON public.medications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinician'::app_role));

CREATE POLICY "Clinicians can update medications"
ON public.medications FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinician'::app_role));

CREATE POLICY "Staff can view medications"
ON public.medications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinician'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for allergies
CREATE POLICY "Staff can create allergies"
ON public.allergies FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinician'::app_role) OR has_role(auth.uid(), 'reception'::app_role));

CREATE POLICY "Staff can update allergies"
ON public.allergies FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinician'::app_role));

CREATE POLICY "Staff can view allergies"
ON public.allergies FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinician'::app_role) OR has_role(auth.uid(), 'reception'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for vital_signs
CREATE POLICY "Clinicians can create vital signs"
ON public.vital_signs FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinician'::app_role));

CREATE POLICY "Clinicians can update vital signs"
ON public.vital_signs FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinician'::app_role));

CREATE POLICY "Staff can view vital signs"
ON public.vital_signs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'clinician'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create indexes
CREATE INDEX idx_medications_patient_id ON public.medications(patient_id);
CREATE INDEX idx_medications_status ON public.medications(status);
CREATE INDEX idx_allergies_patient_id ON public.allergies(patient_id);
CREATE INDEX idx_vital_signs_patient_id ON public.vital_signs(patient_id);
CREATE INDEX idx_vital_signs_session_id ON public.vital_signs(session_id);

-- Add triggers for updated_at
CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_allergies_updated_at
BEFORE UPDATE ON public.allergies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vital_signs_updated_at
BEFORE UPDATE ON public.vital_signs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();