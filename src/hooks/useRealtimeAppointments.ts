import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RealtimeAppointmentsProps {
  onAppointmentUpdate: () => void;
}

export const useRealtimeAppointments = ({ onAppointmentUpdate }: RealtimeAppointmentsProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('appointments-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Appointment update:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New appointment scheduled",
              description: "The appointments list has been updated",
            });
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.status !== payload.old.status) {
              toast({
                title: "Appointment status changed",
                description: `Status updated to: ${payload.new.status}`,
              });
            }
          } else if (payload.eventType === 'DELETE') {
            toast({
              title: "Appointment cancelled",
              description: "An appointment has been removed",
            });
          }
          
          onAppointmentUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onAppointmentUpdate, toast]);
};
