-- Allow public (unauthenticated) users to view consultation details for joining
-- This is needed for the /join-consultation page where patients can join without being logged in
CREATE POLICY "Public can view consultations for joining"
ON public.online_consultations
FOR SELECT
TO anon
USING (true);