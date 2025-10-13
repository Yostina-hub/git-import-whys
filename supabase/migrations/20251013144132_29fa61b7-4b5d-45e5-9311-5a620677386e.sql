-- Add read status and user_id to notifications_log
ALTER TABLE public.notifications_log
ADD COLUMN IF NOT EXISTS read_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications_log(user_id, read_at) 
WHERE read_at IS NULL;

-- Update RLS policies for notifications_log to allow users to view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications_log;
CREATE POLICY "Users can view their own notifications"
ON public.notifications_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications_log;
CREATE POLICY "Users can update their own notifications"
ON public.notifications_log
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_log;