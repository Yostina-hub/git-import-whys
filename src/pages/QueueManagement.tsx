import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Clock, CheckCircle } from "lucide-react";

const QueueManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [queues, setQueues] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    loadQueues();
  }, []);

  useEffect(() => {
    if (selectedQueue) {
      loadTickets(selectedQueue);
      const interval = setInterval(() => loadTickets(selectedQueue), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedQueue]);

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
    const { data } = await supabase
      .from("tickets")
      .select("*, patients(first_name, last_name, mrn), profiles(first_name, last_name)")
      .eq("queue_id", queueId)
      .in("status", ["waiting", "called"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (data) setTickets(data);
  };

  const callNext = async () => {
    if (!selectedQueue) return;
    
    const nextTicket = tickets.find(t => t.status === "waiting");
    if (!nextTicket) {
      toast({
        title: "No tickets waiting",
        description: "There are no patients waiting in this queue.",
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
      stat: "bg-red-500",
      vip: "bg-purple-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  const getWaitTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    return diffMinutes;
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
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Waiting</p>
                  <p className="text-3xl font-bold">{tickets.filter(t => t.status === "waiting").length}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Called</p>
                  <p className="text-3xl font-bold">{tickets.filter(t => t.status === "called").length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                  <p className="text-3xl font-bold">
                    {tickets.length > 0
                      ? Math.round(tickets.reduce((acc, t) => acc + getWaitTime(t.created_at), 0) / tickets.length)
                      : 0}
                    <span className="text-sm">min</span>
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button onClick={callNext} className="w-full" size="lg">
                Call Next Patient
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Queue Monitor</CardTitle>
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
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
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
                            {getWaitTime(ticket.created_at)} min
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
                      ))}
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
