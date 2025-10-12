-- Allow clinicians to update tickets for triage workflow
DROP POLICY IF EXISTS "Staff can update tickets" ON tickets;

CREATE POLICY "Staff can update tickets" 
ON tickets 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'reception'::app_role)
  OR has_role(auth.uid(), 'clinician'::app_role)
);

-- Allow clinicians to insert tickets (for queue management)
DROP POLICY IF EXISTS "Staff can manage tickets" ON tickets;

CREATE POLICY "Staff can create tickets" 
ON tickets 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'reception'::app_role)
  OR has_role(auth.uid(), 'clinician'::app_role)
);