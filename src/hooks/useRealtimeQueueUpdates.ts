import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RealtimeQueueUpdatesProps {
  onTicketUpdate: () => void;
}

export const useRealtimeQueueUpdates = ({ onTicketUpdate }: RealtimeQueueUpdatesProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          console.log('Queue update:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New patient in queue",
              description: `Token: ${payload.new.token_number}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.status === 'called') {
              toast({
                title: "Patient called",
                description: `Token: ${payload.new.token_number}`,
              });
            } else if (payload.new.status === 'served') {
              toast({
                title: "Patient served",
                description: `Token: ${payload.new.token_number}`,
              });
            }
          }
          
          onTicketUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onTicketUpdate, toast]);
};
