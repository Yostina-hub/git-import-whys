-- Create analytics views and reporting tables

-- Revenue analytics view
CREATE OR REPLACE VIEW public.revenue_analytics AS
SELECT 
  DATE_TRUNC('day', i.issued_at) as report_date,
  COUNT(DISTINCT i.id) as invoice_count,
  COUNT(DISTINCT i.patient_id) as unique_patients,
  SUM(i.total_amount) as total_revenue,
  SUM(i.balance_due) as outstanding_balance,
  SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) as paid_revenue,
  SUM(CASE WHEN i.status = 'draft' THEN i.total_amount ELSE 0 END) as draft_revenue
FROM public.invoices i
WHERE i.issued_at IS NOT NULL
GROUP BY DATE_TRUNC('day', i.issued_at);

-- Appointment analytics view
CREATE OR REPLACE VIEW public.appointment_analytics AS
SELECT 
  DATE_TRUNC('day', a.scheduled_start) as report_date,
  a.status,
  COUNT(*) as appointment_count,
  COUNT(DISTINCT a.patient_id) as unique_patients,
  COUNT(DISTINCT a.provider_id) as unique_providers
FROM public.appointments a
GROUP BY DATE_TRUNC('day', a.scheduled_start), a.status;

-- Patient demographics view
CREATE OR REPLACE VIEW public.patient_demographics AS
SELECT 
  p.gender_identity,
  p.sex_at_birth,
  EXTRACT(YEAR FROM AGE(p.date_of_birth)) as age_bracket,
  COUNT(*) as patient_count
FROM public.patients p
GROUP BY p.gender_identity, p.sex_at_birth, EXTRACT(YEAR FROM AGE(p.date_of_birth));

-- Clinical activity view
CREATE OR REPLACE VIEW public.clinical_activity AS
SELECT 
  DATE_TRUNC('day', ts.performed_at) as report_date,
  COUNT(DISTINCT ts.id) as session_count,
  COUNT(DISTINCT ts.patient_id) as unique_patients,
  COUNT(DISTINCT ts.clinician_id) as active_clinicians
FROM public.treatment_sessions ts
GROUP BY DATE_TRUNC('day', ts.performed_at);

-- Grant access to views
GRANT SELECT ON public.revenue_analytics TO authenticated;
GRANT SELECT ON public.appointment_analytics TO authenticated;
GRANT SELECT ON public.patient_demographics TO authenticated;
GRANT SELECT ON public.clinical_activity TO authenticated;