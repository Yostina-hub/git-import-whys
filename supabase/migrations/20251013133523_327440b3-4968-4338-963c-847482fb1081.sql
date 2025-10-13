-- Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'email', 'sms', 'push'
  event_type TEXT NOT NULL, -- 'appointment_reminder', 'appointment_confirmation', 'test_results', 'custom'
  subject TEXT,
  body_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications log table
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type TEXT NOT NULL, -- 'patient', 'staff'
  recipient_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'email', 'sms', 'push', 'internal'
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  template_id UUID REFERENCES public.notification_templates(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled notifications table
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type TEXT NOT NULL,
  recipient_id UUID NOT NULL,
  template_id UUID REFERENCES public.notification_templates(id),
  notification_type TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'
  sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_templates
CREATE POLICY "Staff can view templates"
ON public.notification_templates FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'reception'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Admins can manage templates"
ON public.notification_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for notifications_log
CREATE POLICY "Staff can view notification logs"
ON public.notifications_log FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'reception'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Staff can create notification logs"
ON public.notifications_log FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'reception'::app_role)
);

-- RLS Policies for scheduled_notifications
CREATE POLICY "Staff can view scheduled notifications"
ON public.scheduled_notifications FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'reception'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Staff can manage scheduled notifications"
ON public.scheduled_notifications FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'reception'::app_role)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_log_recipient ON public.notifications_log(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_log_status ON public.notifications_log(status);
CREATE INDEX IF NOT EXISTS idx_notifications_log_created ON public.notifications_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON public.scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON public.scheduled_notifications(status);

-- Insert default templates
INSERT INTO public.notification_templates (name, type, event_type, subject, body_template) VALUES
('Appointment Reminder - Email', 'email', 'appointment_reminder', 'Appointment Reminder - {{appointment_date}}', 'Dear {{patient_name}},

This is a reminder about your upcoming appointment at {{clinic_name}} on {{appointment_date}} at {{appointment_time}}.

Provider: {{provider_name}}
Location: {{clinic_address}}

If you need to reschedule, please contact us at {{clinic_phone}}.

Thank you!'),

('Appointment Confirmation - SMS', 'sms', 'appointment_confirmation', null, 'Hi {{patient_name}}, your appointment at {{clinic_name}} is confirmed for {{appointment_date}} at {{appointment_time}}. Reply CONFIRM to confirm or CANCEL to cancel.'),

('Test Results Ready - Email', 'email', 'test_results', 'Your Test Results are Ready', 'Dear {{patient_name}},

Your test results are now available. Please log in to your patient portal to view them, or contact us to schedule a follow-up appointment.

Best regards,
{{clinic_name}}'),

('Payment Receipt - Email', 'email', 'payment_received', 'Payment Receipt - {{invoice_number}}', 'Dear {{patient_name}},

Thank you for your payment of ${{payment_amount}} for invoice {{invoice_number}}.

Payment Date: {{payment_date}}
Payment Method: {{payment_method}}

Your receipt has been attached to this email.

Thank you for choosing {{clinic_name}}!'),

('Welcome New Patient - Email', 'email', 'welcome', 'Welcome to {{clinic_name}}', 'Dear {{patient_name}},

Welcome to {{clinic_name}}! We''re delighted to have you as our patient.

Your Medical Record Number (MRN) is: {{mrn}}

To get started:
1. Complete your medical history in the patient portal
2. Update your insurance information
3. Set your appointment preferences

If you have any questions, please don''t hesitate to contact us.

Best regards,
The {{clinic_name}} Team');