-- Create online consultations table
CREATE TABLE public.online_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  doctor_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  consultation_type TEXT NOT NULL DEFAULT 'video', -- video, audio, chat
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, waiting, active, completed, cancelled
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  room_id TEXT UNIQUE NOT NULL,
  session_metadata JSONB DEFAULT '{}',
  recording_consent BOOLEAN DEFAULT false,
  recording_url TEXT,
  ai_summary TEXT,
  connection_quality JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create consultation messages table for real-time chat
CREATE TABLE public.consultation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.online_consultations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL, -- doctor, patient
  message_type TEXT NOT NULL DEFAULT 'text', -- text, file, system
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create consultation prescriptions table
CREATE TABLE public.consultation_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.online_consultations(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  prescribed_by UUID NOT NULL,
  medications JSONB NOT NULL DEFAULT '[]',
  diagnosis TEXT,
  instructions TEXT,
  valid_until DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.online_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for online_consultations
CREATE POLICY "Doctors can view their consultations"
ON public.online_consultations FOR SELECT
USING (doctor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can create consultations"
ON public.online_consultations FOR INSERT
WITH CHECK (doctor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can update their consultations"
ON public.online_consultations FOR UPDATE
USING (doctor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for consultation_messages
CREATE POLICY "Consultation participants can view messages"
ON public.consultation_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.online_consultations 
    WHERE id = consultation_id 
    AND (doctor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Consultation participants can send messages"
ON public.consultation_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.online_consultations 
    WHERE id = consultation_id 
    AND (doctor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can update their own messages"
ON public.consultation_messages FOR UPDATE
USING (sender_id = auth.uid());

-- RLS Policies for consultation_prescriptions
CREATE POLICY "Doctors can manage prescriptions"
ON public.consultation_prescriptions FOR ALL
USING (prescribed_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view prescriptions"
ON public.consultation_prescriptions FOR SELECT
USING (has_role(auth.uid(), 'clinician'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_consultations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_messages;

-- Create indexes
CREATE INDEX idx_consultations_doctor ON public.online_consultations(doctor_id);
CREATE INDEX idx_consultations_patient ON public.online_consultations(patient_id);
CREATE INDEX idx_consultations_status ON public.online_consultations(status);
CREATE INDEX idx_consultation_messages_consultation ON public.consultation_messages(consultation_id);
CREATE INDEX idx_consultation_messages_created ON public.consultation_messages(created_at);

-- Update timestamp trigger
CREATE TRIGGER update_online_consultations_updated_at
  BEFORE UPDATE ON public.online_consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultation_prescriptions_updated_at
  BEFORE UPDATE ON public.consultation_prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();