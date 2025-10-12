-- Enable realtime for key tables

-- Enable realtime for appointments (for live scheduling updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- Enable realtime for tickets (for queue management)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- Enable realtime for orders (for order status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;