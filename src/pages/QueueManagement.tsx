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
import { QueueStatistics } from "@/components/queue/QueueStatistics";
import { QueueActions } from "@/components/queue/QueueActions";
import { QueueFilters } from "@/components/queue/QueueFilters";
import { QueueDisplaySettings } from "@/components/queue/QueueDisplaySettings";
import { QueueAnalytics } from "@/components/queue/QueueAnalytics";
import { RoutingRules } from "@/components/queue/RoutingRules";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const QueueManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [queues, setQueues] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSLA, setCurrentSLA] = useState(30);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showOnlySLABreaches, setShowOnlySLABreaches] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    checkAuth();
    loadQueues();
  }, []);

  useEffect(() => {
    if (selectedQueue) {
      loadTickets(selectedQueue);
      const queue = queues.find(q => q.id === selectedQueue);
      if (queue) setCurrentSLA(queue.sla_minutes || 30);
      
      // Poll for updates every 5 seconds
      const interval = setInterval(() => loadTickets(selectedQueue), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedQueue, queues]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadQueues = async () => {
    const { data, error } = await supabase
      .from("queues")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading queues",
        description: error.message,
      });
    } else if (data && data.length > 0) {
      setQueues(data);
      setSelectedQueue(data[0].id);
    }
  };

  const loadTickets = async (queueId: string) => {
    console.log("Loading tickets for queue:", queueId);
    const { data, error } = await supabase
      .from("tickets")
      .select("*, patients(first_name, last_name, mrn), profiles(first_name, last_name)")
      .eq("queue_id", queueId)
      .in("status", ["waiting", "called"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading tickets:", error);
    } else {
      console.log("Loaded tickets:", data);
      setTickets(data || []);
    }
  };

  const getWaitTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    return diffMinutes;
  };

  const playNotificationSound = () => {
    if (audioEnabled) {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77BdGAg+ltryxnIlBSp+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXx0H0pBSd6yfDckTsHE1qw6u2nVBML");
      audio.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  const callNext = async () => {
    if (!selectedQueue) return;
    
    console.log("Current tickets:", tickets);
    const nextTicket = tickets.find(t => t.status === "waiting");
    console.log("Next ticket to call:", nextTicket);
    
    if (!nextTicket) {
      toast({
        title: "No tickets waiting",
        description: `There are ${tickets.length} total tickets, but none with 'waiting' status.`,
      });
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({ status: "called", called_at: new Date().toISOString() })
      .eq("id", nextTicket.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
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
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Ticket completed",
        description: "Patient marked as served",
      });
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

  const filteredTickets = tickets.filter((ticket) => {
    const waitTime = getWaitTime(ticket.created_at);
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesSLA = !showOnlySLABreaches || waitTime > currentSLA;
    return matchesPriority && matchesSLA;
  });


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
        <QueueStatistics tickets={tickets} slaMinutes={currentSLA} />
        
        <div className="mt-6 mb-6 flex items-center justify-between">
          <Button onClick={callNext} size="lg">
            Call Next Patient
          </Button>
          
          <div className="flex items-center gap-2">
            <Switch
              id="audio-enabled"
              checked={audioEnabled}
              onCheckedChange={setAudioEnabled}
            />
            <Label htmlFor="audio-enabled" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Sound notifications
            </Label>
          </div>
        </div>

        <Tabs defaultValue="monitor" className="space-y-4">
          <TabsList>
            <TabsTrigger value="monitor">Queue Monitor</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="routing">Routing Rules</TabsTrigger>
            <TabsTrigger value="display">Display Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Queues</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedQueue || ""} onValueChange={setSelectedQueue}>
                  <TabsList className="grid w-full grid-cols-5">
                  {queues.map((queue) => (
                    <TabsTrigger key={queue.id} value={queue.id}>
                      {queue.name}
                    </TabsTrigger>
                  ))}
                  </TabsList>

                  {queues.map((queue) => (
                    <TabsContent key={queue.id} value={queue.id}>
                      <QueueFilters
                    priorityFilter={priorityFilter}
                        setPriorityFilter={setPriorityFilter}
                        showOnlySLABreaches={showOnlySLABreaches}
                        setShowOnlySLABreaches={setShowOnlySLABreaches}
                      />
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Token</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Wait Time (SLA: {currentSLA}min)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTickets.map((ticket) => {
                            const waitTime = getWaitTime(ticket.created_at);
                            const slaBreached = waitTime > currentSLA;
                            return (
                              <TableRow key={ticket.id} className={slaBreached ? "bg-red-50 dark:bg-red-950/20" : ""}>
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
                                  <div className="flex items-center gap-2">
                                    {ticket.status === "called" && (
                                      <Button size="sm" onClick={() => markServed(ticket.id)}>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Complete
                                      </Button>
                                    )}
                                    <QueueActions 
                                      ticket={ticket} 
                                      queues={queues}
                                      onUpdate={() => selectedQueue && loadTickets(selectedQueue)} 
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>

                      {filteredTickets.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          {tickets.length === 0 ? "No patients in queue" : "No patients match the current filters"}
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <QueueAnalytics />
          </TabsContent>

          <TabsContent value="routing" className="space-y-4">
            <RoutingRules />
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <QueueDisplaySettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default QueueManagement;
