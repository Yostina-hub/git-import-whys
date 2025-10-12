import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RealtimeOrdersProps {
  onOrderUpdate: () => void;
}

export const useRealtimeOrders = ({ onOrderUpdate }: RealtimeOrdersProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('orders-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order update:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New order created",
              description: `Order type: ${payload.new.order_type}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.status === 'completed') {
              toast({
                title: "Order completed",
                description: `${payload.new.order_type} order has been completed`,
              });
            } else if (payload.new.status !== payload.old.status) {
              toast({
                title: "Order status updated",
                description: `Status: ${payload.new.status}`,
              });
            }
          }
          
          onOrderUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onOrderUpdate, toast]);
};
