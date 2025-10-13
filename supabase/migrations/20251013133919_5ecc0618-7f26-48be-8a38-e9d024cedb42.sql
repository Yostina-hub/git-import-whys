-- Create function to automatically log actions
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_metadata);
END;
$$;

-- Create trigger function for patient changes
CREATE OR REPLACE FUNCTION public.audit_patient_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM log_audit('create', 'patient', NEW.id, 
      jsonb_build_object('name', NEW.first_name || ' ' || NEW.last_name, 'mrn', NEW.mrn));
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM log_audit('update', 'patient', NEW.id, 
      jsonb_build_object('name', NEW.first_name || ' ' || NEW.last_name, 'mrn', NEW.mrn));
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM log_audit('delete', 'patient', OLD.id, 
      jsonb_build_object('name', OLD.first_name || ' ' || OLD.last_name, 'mrn', OLD.mrn));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger function for appointment changes
CREATE OR REPLACE FUNCTION public.audit_appointment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM log_audit('create', 'appointment', NEW.id, 
      jsonb_build_object('patient_id', NEW.patient_id, 'status', NEW.status));
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM log_audit('update', 'appointment', NEW.id, 
      jsonb_build_object('patient_id', NEW.patient_id, 'status', NEW.status, 'old_status', OLD.status));
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM log_audit('delete', 'appointment', OLD.id, 
      jsonb_build_object('patient_id', OLD.patient_id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger function for invoice changes
CREATE OR REPLACE FUNCTION public.audit_invoice_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM log_audit('create', 'invoice', NEW.id, 
      jsonb_build_object('patient_id', NEW.patient_id, 'total_amount', NEW.total_amount, 'status', NEW.status));
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM log_audit('update', 'invoice', NEW.id, 
      jsonb_build_object('patient_id', NEW.patient_id, 'total_amount', NEW.total_amount, 'status', NEW.status, 'old_status', OLD.status));
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM log_audit('delete', 'invoice', OLD.id, 
      jsonb_build_object('patient_id', OLD.patient_id, 'total_amount', OLD.total_amount));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger function for user role changes
CREATE OR REPLACE FUNCTION public.audit_user_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM log_audit('grant_role', 'user', NEW.user_id, 
      jsonb_build_object('role', NEW.role));
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM log_audit('revoke_role', 'user', OLD.user_id, 
      jsonb_build_object('role', OLD.role));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply triggers
DROP TRIGGER IF EXISTS audit_patient_trigger ON public.patients;
CREATE TRIGGER audit_patient_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.audit_patient_changes();

DROP TRIGGER IF EXISTS audit_appointment_trigger ON public.appointments;
CREATE TRIGGER audit_appointment_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.audit_appointment_changes();

DROP TRIGGER IF EXISTS audit_invoice_trigger ON public.invoices;
CREATE TRIGGER audit_invoice_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.audit_invoice_changes();

DROP TRIGGER IF EXISTS audit_user_role_trigger ON public.user_roles;
CREATE TRIGGER audit_user_role_trigger
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_user_role_changes();

-- Insert sample audit logs for testing
INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
SELECT 
  p.id,
  'create',
  'patient',
  pt.id,
  jsonb_build_object('name', pt.first_name || ' ' || pt.last_name, 'mrn', pt.mrn)
FROM public.patients pt
CROSS JOIN (SELECT id FROM public.profiles LIMIT 1) p
LIMIT 10;