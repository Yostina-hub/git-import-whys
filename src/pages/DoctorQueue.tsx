import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Search, ChevronLeft, ChevronRight, RefreshCw, Users, Activity } from "lucide-react";
import { DoctorConsultationDialog } from "@/components/queue/DoctorConsultationDialog";
import { DoctorQueueStats } from "@/components/queue/DoctorQueueStats";
import { EnhancedDoctorCard } from "@/components/queue/EnhancedDoctorCard";
import { StartConsultationDialog } from "@/components/consultation/StartConsultationDialog";

const DoctorQueue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [completedToday, setCompletedToday] = useState<any[]>([]);
  const [previousWork, setPreviousWork] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showConsultationDialog, setShowConsultationDialog] = useState(false);
  const [showOnlineConsultDialog, setShowOnlineConsultDialog] = useState(false);
  
  // Pagination and search state
  const [todaySearch, setTodaySearch] = useState("");
  const [previousSearch, setPreviousSearch] = useState("");
  const [todayPage, setTodayPage] = useState(1);
  const [previousPage, setPreviousPage] = useState(1);
  const [todayTotal, setTodayTotal] = useState(0);
  const [previousTotal, setPreviousTotal] = useState(0);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    checkAuth();
    loadDoctorQueue();
  }, []);

  useEffect(() => {
    loadCompletedToday();
  }, [todayPage, todaySearch]);

  useEffect(() => {
    loadPreviousWork();
  }, [previousPage, previousSearch]);

  useEffect(() => {
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      loadDoctorQueue();
      loadCompletedToday();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadDoctorQueue = async () => {
    console.log("Loading doctor queue...");
    
    // Get doctor queue ID
    const { data: queueData, error: queueError } = await supabase
      .from("queues")
      .select("id")
      .eq("queue_type", "doctor")
      .eq("is_active", true)
      .single();

    if (queueError || !queueData) {
      console.error("Error finding doctor queue:", queueError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Doctor queue not found. Please contact administrator.",
      });
      return;
    }

    // Load tickets for doctor queue
    const { data, error } = await supabase
      .from("tickets")
      .select("*, patients(id, first_name, last_name, mrn, date_of_birth)")
      .eq("queue_id", queueData.id)
      .in("status", ["waiting", "called"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading tickets:", error);
      toast({
        variant: "destructive",
        title: "Error loading queue",
        description: error.message,
      });
    } else {
      console.log("Loaded doctor queue tickets:", data);
      setTickets(data || []);
    }
  };

  const loadCompletedToday = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const from = (todayPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("tickets")
      .select("*, patients(id, first_name, last_name, mrn, date_of_birth)", { count: "exact" })
      .eq("status", "served")
      .eq("served_by", user.id)
      .gte("served_at", today.toISOString())
      .order("served_at", { ascending: false })
      .range(from, to);

    if (todaySearch) {
      query = query.or(
        `token_number.ilike.%${todaySearch}%,patients.first_name.ilike.%${todaySearch}%,patients.last_name.ilike.%${todaySearch}%,patients.mrn.ilike.%${todaySearch}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error loading completed consultations:", error);
    } else {
      setCompletedToday(data || []);
      setTodayTotal(count || 0);
    }
  };

  const loadPreviousWork = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const from = (previousPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("tickets")
      .select("*, patients(id, first_name, last_name, mrn, date_of_birth)", { count: "exact" })
      .eq("status", "served")
      .eq("served_by", user.id)
      .lt("served_at", today.toISOString())
      .order("served_at", { ascending: false })
      .range(from, to);

    if (previousSearch) {
      query = query.or(
        `token_number.ilike.%${previousSearch}%,patients.first_name.ilike.%${previousSearch}%,patients.last_name.ilike.%${previousSearch}%,patients.mrn.ilike.%${previousSearch}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error loading previous work:", error);
    } else {
      setPreviousWork(data || []);
      setPreviousTotal(count || 0);
    }
  };

  const callNext = async () => {
    const nextTicket = tickets.find(t => t.status === "waiting");
    
    if (!nextTicket) {
      toast({
        title: "No patients waiting",
        description: "There are no patients in the queue.",
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
        description: `${nextTicket.patients.first_name} ${nextTicket.patients.last_name}`,
      });
      loadDoctorQueue();
    }
  };

  const viewPatient = (ticket: any) => {
    setSelectedPatient(ticket.patients);
    setSelectedTicket(ticket);
    setShowConsultationDialog(true);
  };

  const startOnlineConsult = (ticket: any) => {
    setSelectedPatient(ticket.patients);
    setSelectedTicket(ticket);
    setShowOnlineConsultDialog(true);
  };

  const handleConsultationComplete = () => {
    loadDoctorQueue();
    loadCompletedToday();
  };

  const getWaitTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    return diffMinutes;
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      waiting: "bg-blue-500",
      called: "bg-orange-500",
      served: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const avgWaitTime = tickets.length > 0
    ? Math.floor(tickets.reduce((sum, t) => sum + getWaitTime(t.created_at), 0) / tickets.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/dashboard")} 
                className="hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Doctor Queue
                  </h1>
                  <p className="text-sm text-muted-foreground">Real-time patient consultations</p>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadDoctorQueue}
              className="gap-2 hover:bg-primary/10 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats Overview */}
        <DoctorQueueStats
          waiting={tickets.filter(t => t.status === "waiting").length}
          inConsultation={tickets.filter(t => t.status === "called").length}
          completedToday={completedToday.length}
          avgWaitTime={avgWaitTime}
        />

        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger 
              value="queue" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Users className="h-4 w-4 mr-2" />
              Current Queue
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300"
            >
              Today's Work ({completedToday.length})
            </TabsTrigger>
            <TabsTrigger 
              value="previous"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              Previous Work ({previousWork.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">
                  Live Queue • Auto-refresh every 10s
                </span>
              </div>
              
              <Button 
                onClick={callNext} 
                size="lg"
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Users className="h-5 w-5 mr-2" />
                Call Next Patient
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map((ticket) => (
                <EnhancedDoctorCard
                  key={ticket.id}
                  ticket={ticket}
                  onConsult={viewPatient}
                  onOnlineConsult={startOnlineConsult}
                />
              ))}
            </div>

            {tickets.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">No patients in queue</p>
                  <p className="text-sm text-muted-foreground mt-1">The doctor queue is currently empty</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-green-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    Completed Consultations Today
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, MRN, token..."
                      value={todaySearch}
                      onChange={(e) => {
                        setTodaySearch(e.target.value);
                        setTodayPage(1);
                      }}
                      className="pl-9 border-0 bg-muted/50 focus-visible:ring-green-500"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time Completed</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>MRN</TableHead>
                      <TableHead>Priority</TableHead>
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
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority.toUpperCase()}
                          </Badge>
                        </TableCell>
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

                {completedToday.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {todaySearch ? "No matching consultations found" : "No consultations completed today yet"}
                  </div>
                )}

                {todayTotal > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {((todayPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(todayPage * ITEMS_PER_PAGE, todayTotal)} of {todayTotal} consultations
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTodayPage(p => Math.max(1, p - 1))}
                        disabled={todayPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {todayPage} of {Math.ceil(todayTotal / ITEMS_PER_PAGE)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTodayPage(p => p + 1)}
                        disabled={todayPage >= Math.ceil(todayTotal / ITEMS_PER_PAGE)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="previous">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-purple-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    Previous Consultations
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, MRN, token..."
                      value={previousSearch}
                      onChange={(e) => {
                        setPreviousSearch(e.target.value);
                        setPreviousPage(1);
                      }}
                      className="pl-9 border-0 bg-muted/50 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>MRN</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previousWork.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          {new Date(ticket.served_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(ticket.served_at).toLocaleTimeString()}
                        </TableCell>
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

                {previousWork.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {previousSearch ? "No matching consultations found" : "No previous consultations found"}
                  </div>
                )}

                {previousTotal > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {((previousPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(previousPage * ITEMS_PER_PAGE, previousTotal)} of {previousTotal} consultations
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviousPage(p => Math.max(1, p - 1))}
                        disabled={previousPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {previousPage} of {Math.ceil(previousTotal / ITEMS_PER_PAGE)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviousPage(p => p + 1)}
                        disabled={previousPage >= Math.ceil(previousTotal / ITEMS_PER_PAGE)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Consultation Dialog */}
      <DoctorConsultationDialog
        ticket={selectedTicket}
        patient={selectedPatient}
        open={showConsultationDialog}
        onOpenChange={setShowConsultationDialog}
        onComplete={handleConsultationComplete}
      />

      {/* Online Consultation Dialog */}
      {selectedPatient && (
        <StartConsultationDialog
          open={showOnlineConsultDialog}
          onOpenChange={setShowOnlineConsultDialog}
          patientId={selectedPatient.id}
          onConsultationStarted={handleConsultationComplete}
        />
      )}
    </div>
  );
};

export default DoctorQueue;
