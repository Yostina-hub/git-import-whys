# Queue Management System Documentation

Complete technical documentation for implementing a queue management system in Lovable.

---

## Table of Contents
1. [Database Schema](#database-schema)
2. [Pages](#pages)
3. [Hooks](#hooks)
4. [Components](#components)
5. [Routes Setup](#routes-setup)

---

## Database Schema

Run this SQL migration to create the required tables:

```sql
-- Create queue type enum (optional, can use TEXT)
CREATE TYPE queue_type AS ENUM ('triage', 'doctor', 'lab', 'pharmacy', 'billing');
CREATE TYPE ticket_status AS ENUM ('waiting', 'called', 'served', 'no_show');
CREATE TYPE priority_level AS ENUM ('routine', 'urgent', 'stat', 'vip');

-- Queues table
CREATE TABLE public.queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  queue_type TEXT NOT NULL, -- 'triage', 'doctor', 'lab', etc.
  sla_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

-- Tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES queues(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  token_number TEXT NOT NULL,
  status TEXT DEFAULT 'waiting', -- waiting, called, served, no_show
  priority TEXT DEFAULT 'routine', -- routine, urgent, stat, vip
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  called_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  served_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for queues
CREATE POLICY "Authenticated users can view queues"
ON public.queues FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage queues"
ON public.queues FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tickets
CREATE POLICY "Authenticated users can view tickets"
ON public.tickets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert tickets"
ON public.tickets FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tickets"
ON public.tickets FOR UPDATE TO authenticated USING (true);

-- Function to generate ticket token
CREATE OR REPLACE FUNCTION public.generate_ticket_token(queue_prefix text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  counter INTEGER;
  new_token TEXT;
BEGIN
  counter := (SELECT COUNT(*) FROM public.tickets WHERE created_at::date = CURRENT_DATE) + 1;
  new_token := queue_prefix || LPAD(counter::TEXT, 4, '0');
  RETURN new_token;
END;
$$;

-- Enable realtime for tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- Insert default queues
INSERT INTO public.queues (name, queue_type, sla_minutes) VALUES
('Triage', 'triage', 15),
('Doctor Consultation', 'doctor', 30),
('Laboratory', 'lab', 45),
('Pharmacy', 'pharmacy', 20),
('Billing', 'billing', 15);
```

---

## Pages

### src/pages/QueueManagement.tsx

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, AlertCircle, Users, Clock, Volume2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const QueueManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [queues, setQueues] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [currentSLA, setCurrentSLA] = useState(30);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadQueues();
  }, []);

  useEffect(() => {
    if (selectedQueue) {
      loadTickets(selectedQueue);
      const queue = queues.find(q => q.id === selectedQueue);
      if (queue) setCurrentSLA(queue.sla_minutes || 30);
      
      // Poll for updates every 5 seconds
      const interval = setInterval(() => {
        loadTickets(selectedQueue);
        loadQueueCounts();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedQueue, queues]);

  const loadQueues = async () => {
    const { data, error } = await supabase
      .from("queues")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast({ variant: "destructive", title: "Error loading queues", description: error.message });
    } else if (data && data.length > 0) {
      setQueues(data);
      setSelectedQueue(data[0].id);
      loadQueueCounts();
    }
  };

  const loadTickets = async (queueId: string) => {
    const { data, error } = await supabase
      .from("tickets")
      .select(`*, patients(first_name, last_name, mrn), queues(name, queue_type)`)
      .eq("queue_id", queueId)
      .in("status", ["waiting", "called"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      toast({ variant: "destructive", title: "Error loading tickets", description: error.message });
    } else {
      setTickets(data || []);
    }
  };

  const loadQueueCounts = async () => {
    const { data } = await supabase
      .from('tickets')
      .select('queue_id')
      .eq('status', 'waiting');

    const counts: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      counts[row.queue_id] = (counts[row.queue_id] || 0) + 1;
    });
    setQueueCounts(counts);
  };

  const getWaitTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    return Math.floor((now.getTime() - created.getTime()) / 60000);
  };

  const playNotificationSound = () => {
    if (audioEnabled) {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10...");
      audio.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  const callNext = async () => {
    if (!selectedQueue) return;
    
    const nextTicket = tickets.find(t => t.status === "waiting");
    if (!nextTicket) {
      toast({ title: "No tickets waiting", description: "Queue is empty" });
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({ status: "called", called_at: new Date().toISOString() })
      .eq("id", nextTicket.id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      playNotificationSound();
      toast({
        title: "Patient called",
        description: `Token ${nextTicket.token_number} - ${nextTicket.patients.first_name} ${nextTicket.patients.last_name}`,
      });
      loadTickets(selectedQueue);
    }
  };

  const markServed = async (ticketId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("tickets")
      .update({ 
        status: "served", 
        served_at: new Date().toISOString(),
        served_by: user?.id 
      })
      .eq("id", ticketId);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Ticket completed", description: "Patient marked as served" });
      if (selectedQueue) loadTickets(selectedQueue);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      waiting: "bg-blue-500",
      called: "bg-orange-500",
      served: "bg-green-500",
      no_show: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      routine: "bg-gray-500",
      urgent: "bg-orange-500",
      stat: "bg-red-500",
      vip: "bg-purple-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Queue Management</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Waiting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.filter(t => t.status === "waiting").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Called</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.filter(t => t.status === "called").length}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6 flex items-center justify-between">
          <Button onClick={callNext} size="lg">Call Next Patient</Button>
          
          <div className="flex items-center gap-2">
            <Switch id="audio-enabled" checked={audioEnabled} onCheckedChange={setAudioEnabled} />
            <Label htmlFor="audio-enabled" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Sound notifications
            </Label>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Queues</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedQueue || ""} onValueChange={setSelectedQueue}>
              <TabsList>
                {queues.map((queue) => (
                  <TabsTrigger key={queue.id} value={queue.id}>
                    {queue.name}
                    {queueCounts[queue.id] > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {queueCounts[queue.id]}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {queues.map((queue) => (
                <TabsContent key={queue.id} value={queue.id}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Wait Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => {
                        const waitTime = getWaitTime(ticket.created_at);
                        const slaBreached = waitTime > currentSLA;
                        return (
                          <TableRow key={ticket.id} className={slaBreached ? "bg-red-50" : ""}>
                            <TableCell className="font-bold">{ticket.token_number}</TableCell>
                            <TableCell>
                              {ticket.patients.mrn} - {ticket.patients.first_name} {ticket.patients.last_name}
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {slaBreached && <AlertCircle className="h-4 w-4 text-red-500" />}
                                <span className={slaBreached ? "text-red-600 font-semibold" : ""}>
                                  {waitTime} min
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {ticket.status === "called" && (
                                <Button size="sm" onClick={() => markServed(ticket.id)}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {tickets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No patients in queue
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default QueueManagement;
```

### src/pages/QueueDisplay.tsx (Public Display)

```tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DisplayTicket {
  id: string;
  token_number: string;
  status: string;
  priority: string;
  queue_name: string;
  patient_name: string;
  station?: string;
}

export default function QueueDisplay() {
  const [currentlyServing, setCurrentlyServing] = useState<DisplayTicket[]>([]);
  const [waitingList, setWaitingList] = useState<DisplayTicket[]>([]);
  const [queueName, setQueueName] = useState<string>("Queue Display");

  const loadDisplayData = async () => {
    const { data: tickets } = await supabase
      .from("tickets")
      .select(`*, queues(name), patients(first_name, last_name)`)
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
      }));

      setCurrentlyServing(mapped.filter(t => t.status === "called"));
      setWaitingList(mapped.filter(t => t.status === "waiting").slice(0, 10));
    }
  };

  useEffect(() => {
    loadDisplayData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("queue-display-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
        loadDisplayData();
      })
      .subscribe();

    // Also poll every 30 seconds as backup
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
                <Card key={ticket.id} className="p-6 bg-primary text-primary-foreground animate-pulse">
                  <div className="text-center space-y-3">
                    <div className="text-5xl font-bold">{ticket.token_number}</div>
                    <div className="text-xl opacity-90">{ticket.patient_name}</div>
                    <Badge variant={getPriorityColor(ticket.priority)}>
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
                <div key={ticket.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-mono font-bold text-primary">{index + 1}</span>
                    <div className="text-xl font-semibold">{ticket.token_number}</div>
                    <Badge variant={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                  </div>
                  <div className="text-lg text-muted-foreground">{ticket.patient_name}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
```

### src/pages/DoctorQueue.tsx

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, RefreshCw, Users, Activity } from "lucide-react";

const DoctorQueue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [completedToday, setCompletedToday] = useState<any[]>([]);

  useEffect(() => {
    loadDoctorQueue();
    loadCompletedToday();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      loadDoctorQueue();
      loadCompletedToday();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadDoctorQueue = async () => {
    // Get doctor queue ID
    const { data: queueData } = await supabase
      .from("queues")
      .select("id")
      .eq("queue_type", "doctor")
      .eq("is_active", true)
      .single();

    if (!queueData) return;

    const { data, error } = await supabase
      .from("tickets")
      .select("*, patients(id, first_name, last_name, mrn, date_of_birth)")
      .eq("queue_id", queueData.id)
      .in("status", ["waiting", "called"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (!error) setTickets(data || []);
  };

  const loadCompletedToday = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("tickets")
      .select("*, patients(id, first_name, last_name, mrn)")
      .eq("status", "served")
      .eq("served_by", user.id)
      .gte("served_at", today.toISOString())
      .order("served_at", { ascending: false });

    setCompletedToday(data || []);
  };

  const callNext = async () => {
    const nextTicket = tickets.find(t => t.status === "waiting");
    if (!nextTicket) {
      toast({ title: "No patients waiting" });
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({ status: "called", called_at: new Date().toISOString() })
      .eq("id", nextTicket.id);

    if (!error) {
      toast({
        title: "Patient called",
        description: `${nextTicket.patients.first_name} ${nextTicket.patients.last_name}`,
      });
      loadDoctorQueue();
    }
  };

  const completeConsultation = async (ticketId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("tickets")
      .update({ 
        status: "served", 
        served_at: new Date().toISOString(),
        served_by: user?.id 
      })
      .eq("id", ticketId);

    if (!error) {
      toast({ title: "Consultation completed" });
      loadDoctorQueue();
      loadCompletedToday();
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      routine: "bg-gray-500",
      urgent: "bg-orange-500",
      stat: "bg-red-500",
      vip: "bg-purple-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <h1 className="text-2xl font-bold mt-2">Doctor Queue</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Waiting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.filter(t => t.status === "waiting").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">In Consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tickets.filter(t => t.status === "called").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedToday.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between">
          <Button onClick={callNext} size="lg">
            <Users className="h-5 w-5 mr-2" />
            Call Next Patient
          </Button>
          <Button variant="outline" onClick={loadDoctorQueue}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="queue">
          <TabsList>
            <TabsTrigger value="queue">Current Queue</TabsTrigger>
            <TabsTrigger value="completed">Completed Today ({completedToday.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>MRN</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-bold">{ticket.token_number}</TableCell>
                        <TableCell>
                          {ticket.patients.first_name} {ticket.patients.last_name}
                        </TableCell>
                        <TableCell>{ticket.patients.mrn}</TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ticket.status === "called" ? "default" : "secondary"}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.status === "called" && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => navigate(`/clinical?patient=${ticket.patients.id}`)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Consult
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => completeConsultation(ticket.id)}
                              >
                                Complete
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {tickets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No patients in queue
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>MRN</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedToday.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          {new Date(ticket.served_at).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="font-bold">{ticket.token_number}</TableCell>
                        <TableCell>
                          {ticket.patients.first_name} {ticket.patients.last_name}
                        </TableCell>
                        <TableCell>{ticket.patients.mrn}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/clinical?patient=${ticket.patients.id}`)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Records
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DoctorQueue;
```

---

## Hooks

### src/hooks/useRealtimeQueueUpdates.ts

```tsx
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
```

---

## Components

### src/components/queue/QueueStatistics.tsx

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";

interface QueueStatisticsProps {
  tickets: any[];
  slaMinutes: number;
}

export const QueueStatistics = ({ tickets, slaMinutes }: QueueStatisticsProps) => {
  const waitingCount = tickets.filter(t => t.status === "waiting").length;
  const calledCount = tickets.filter(t => t.status === "called").length;
  const servedToday = tickets.filter(t => {
    const today = new Date().toDateString();
    return t.served_at && new Date(t.served_at).toDateString() === today;
  }).length;

  const getWaitTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    return Math.floor((now.getTime() - created.getTime()) / 60000);
  };

  const activeTickets = tickets.filter(t => t.status === "waiting" || t.status === "called");
  const avgWaitTime = activeTickets.length > 0
    ? Math.round(activeTickets.reduce((acc, t) => acc + getWaitTime(t.created_at), 0) / activeTickets.length)
    : 0;

  const slaBreaches = activeTickets.filter(t => getWaitTime(t.created_at) > slaMinutes).length;
  const slaCompliance = activeTickets.length > 0 
    ? Math.round(((activeTickets.length - slaBreaches) / activeTickets.length) * 100)
    : 100;

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Waiting</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{waitingCount}</div>
          <p className="text-xs text-muted-foreground">In queue</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Called</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{calledCount}</div>
          <p className="text-xs text-muted-foreground">Being served</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgWaitTime}<span className="text-sm font-normal">min</span></div>
          <p className="text-xs text-muted-foreground">Current average</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Served Today</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{servedToday}</div>
          <p className="text-xs text-muted-foreground">Completed tickets</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${slaCompliance >= 80 ? 'text-green-500' : 'text-red-500'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{slaCompliance}%</div>
          <p className="text-xs text-muted-foreground">{slaBreaches} breaches</p>
        </CardContent>
      </Card>
    </div>
  );
};
```

### src/components/queue/QueueFilters.tsx

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface QueueFiltersProps {
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  showOnlySLABreaches: boolean;
  setShowOnlySLABreaches: (value: boolean) => void;
}

export const QueueFilters = ({
  priorityFilter,
  setPriorityFilter,
  showOnlySLABreaches,
  setShowOnlySLABreaches,
}: QueueFiltersProps) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="priority-filter">Priority:</Label>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger id="priority-filter" className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="routine">Routine</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="stat">STAT</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="sla-breaches"
          checked={showOnlySLABreaches}
          onCheckedChange={setShowOnlySLABreaches}
        />
        <Label htmlFor="sla-breaches">Show only SLA breaches</Label>
      </div>
    </div>
  );
};
```

---

## Routes Setup

Add these routes to your `src/App.tsx`:

```tsx
import QueueManagement from "./pages/QueueManagement";
import DoctorQueue from "./pages/DoctorQueue";
import TriageQueue from "./pages/TriageQueue";
import QueueDisplay from "./pages/QueueDisplay";

// In your Routes:
<Route path="/queue-display" element={<QueueDisplay />} />

<Route element={<AppLayout />}>
  <Route path="/queue" element={<QueueManagement />} />
  <Route path="/doctor-queue" element={<DoctorQueue />} />
  <Route path="/triage-queue" element={<TriageQueue />} />
</Route>
```

---

## Adding Patient to Queue

Helper function to add a patient to a queue:

```tsx
const addToQueue = async (patientId: string, queueId: string, priority: string = "routine") => {
  // Get queue prefix
  const { data: queue } = await supabase
    .from("queues")
    .select("name")
    .eq("id", queueId)
    .single();

  const prefix = queue?.name?.substring(0, 1).toUpperCase() || "Q";
  
  // Generate token
  const { data: tokenData } = await supabase.rpc("generate_ticket_token", { 
    queue_prefix: prefix 
  });

  // Create ticket
  const { data, error } = await supabase
    .from("tickets")
    .insert({
      patient_id: patientId,
      queue_id: queueId,
      token_number: tokenData,
      priority: priority,
      status: "waiting"
    })
    .select()
    .single();

  return { data, error };
};
```

---

## Dependencies Required

Make sure these packages are installed:
- `@supabase/supabase-js`
- `date-fns`
- `lucide-react`
- UI components from shadcn/ui

---

## Notes

1. **Realtime**: Enable realtime on the `tickets` table for live updates
2. **RLS**: Adjust RLS policies based on your auth requirements
3. **Patients Table**: This assumes you have a `patients` table with `id`, `first_name`, `last_name`, `mrn` columns
4. **Audio**: The notification sound is a base64 encoded WAV - you can replace with your own sound file
