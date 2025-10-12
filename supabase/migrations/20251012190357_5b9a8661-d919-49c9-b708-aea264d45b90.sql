-- Create enum for days of week
CREATE TYPE public.day_of_week AS ENUM (
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
);

-- Create enum for schedule types
CREATE TYPE public.schedule_type AS ENUM (
  'regular',
  'override',
  'leave'
);

-- Create provider_schedules table
CREATE TABLE public.provider_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  schedule_type schedule_type NOT NULL DEFAULT 'regular',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  break_start TIME,
  break_end TIME,
  max_appointments INTEGER DEFAULT 8,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Create schedule_exceptions table for one-off changes
CREATE TABLE public.schedule_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  exception_type schedule_type NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT NOT NULL,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.provider_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_schedules
CREATE POLICY "Admins can manage all schedules"
  ON public.provider_schedules
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view schedules"
  ON public.provider_schedules
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'reception'::app_role) OR
    has_role(auth.uid(), 'clinician'::app_role)
  );

CREATE POLICY "Providers can view their own schedules"
  ON public.provider_schedules
  FOR SELECT
  USING (provider_id = auth.uid());

-- RLS Policies for schedule_exceptions
CREATE POLICY "Admins and managers can manage exceptions"
  ON public.schedule_exceptions
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "Providers can create their own exceptions"
  ON public.schedule_exceptions
  FOR INSERT
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can view their own exceptions"
  ON public.schedule_exceptions
  FOR SELECT
  USING (
    provider_id = auth.uid() OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "Staff can view exceptions"
  ON public.schedule_exceptions
  FOR SELECT
  USING (
    has_role(auth.uid(), 'reception'::app_role) OR
    has_role(auth.uid(), 'clinician'::app_role)
  );

-- Create indexes for performance
CREATE INDEX idx_provider_schedules_provider ON public.provider_schedules(provider_id);
CREATE INDEX idx_provider_schedules_clinic ON public.provider_schedules(clinic_id);
CREATE INDEX idx_provider_schedules_day ON public.provider_schedules(day_of_week);
CREATE INDEX idx_schedule_exceptions_provider ON public.schedule_exceptions(provider_id);
CREATE INDEX idx_schedule_exceptions_date ON public.schedule_exceptions(exception_date);

-- Create trigger for updated_at
CREATE TRIGGER update_provider_schedules_updated_at
  BEFORE UPDATE ON public.provider_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_exceptions_updated_at
  BEFORE UPDATE ON public.schedule_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();