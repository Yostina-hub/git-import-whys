import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealtimeQueueUpdates } from "@/hooks/useRealtimeQueueUpdates";
import { format } from "date-fns";

interface DisplayTicket {
  id: string;
  token_number: string;
  status: string;
  priority: string;
  queue_name: string;
  patient_name: string;
  station?: string;
  called_at?: string;
}

export default function QueueDisplay() {
  const [currentlyServing, setCurrentlyServing] = useState<DisplayTicket[]>([]);
  const [waitingList, setWaitingList] = useState<DisplayTicket[]>([]);
  const [queueName, setQueueName] = useState<string>("Queue Display");

  const loadDisplayData = async () => {
    const { data: tickets } = await supabase
      .from("tickets")
      .select(`
        *,
        queues(name),
        patients(first_name, last_name)
      `)
      .in("status", ["called", "waiting"])
      .order("created_at", { ascending: true });

    if (tickets) {
      const mapped = tickets.map((t: any) => ({
        id: t.id,
        token_number: t.token_number,
        status: t.status,
        priority: t.priority,
        queue_name: t.queues?.name || "General",
        patient_name: `${t.patients?.first_name} ${t.patients?.last_name}`,
        called_at: t.called_at,
      }));

      setCurrentlyServing(mapped.filter(t => t.status === "called"));
      setWaitingList(mapped.filter(t => t.status === "waiting").slice(0, 10));
      
      if (mapped.length > 0) {
        setQueueName(mapped[0].queue_name);
      }
    }
  };

  useEffect(() => {
    loadDisplayData();

    const channel = supabase
      .channel("queue-display-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        () => {
          loadDisplayData();
        }
      )
      .subscribe();

    const interval = setInterval(loadDisplayData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat": return "destructive";
      case "urgent": return "default";
      case "vip": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-6xl font-bold text-primary">{queueName}</h1>
          <p className="text-2xl text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy - HH:mm")}
          </p>
        </div>

        {/* Currently Being Served */}
        <Card className="p-8 bg-primary/10 border-primary">
          <h2 className="text-3xl font-semibold mb-6">Now Serving</h2>
          {currentlyServing.length === 0 ? (
            <div className="text-center py-12 text-2xl text-muted-foreground">
              No patients currently being served
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentlyServing.map((ticket) => (
                <Card key={ticket.id} className="p-6 bg-primary text-primary-foreground border-none animate-pulse">
                  <div className="text-center space-y-3">
                    <div className="text-5xl font-bold">{ticket.token_number}</div>
                    <div className="text-xl opacity-90">{ticket.patient_name}</div>
                    {ticket.station && (
                      <div className="text-lg font-medium">→ {ticket.station}</div>
                    )}
                    <Badge variant={getPriorityColor(ticket.priority)} className="text-sm">
                      {ticket.priority.toUpperCase()}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Waiting List */}
        <Card className="p-8">
          <h2 className="text-3xl font-semibold mb-6">Waiting ({waitingList.length})</h2>
          {waitingList.length === 0 ? (
            <div className="text-center py-12 text-2xl text-muted-foreground">
              No patients waiting
            </div>
          ) : (
            <div className="grid gap-3">
              {waitingList.map((ticket, index) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-mono font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="text-xl font-semibold">{ticket.token_number}</div>
                    <Badge variant={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="text-lg text-muted-foreground">
                    {ticket.patient_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
