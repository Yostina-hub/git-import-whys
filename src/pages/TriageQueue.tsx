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
import { ArrowLeft, CheckCircle, Clock, FileText, Stethoscope, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { TriageAssessmentDialog } from "@/components/queue/TriageAssessmentDialog";

const TriageQueue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [completedToday, setCompletedToday] = useState<any[]>([]);
  const [previousWork, setPreviousWork] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    name: string;
    ticketId: string;
  } | null>(null);
  const [showTriageDialog, setShowTriageDialog] = useState(false);
  
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
    loadTriageQueue();
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
      loadTriageQueue();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadTriageQueue = async () => {
    console.log("Loading triage queue...");
    
    // Get triage queue ID
    const { data: queueData, error: queueError } = await supabase
      .from("queues")
      .select("id")
      .eq("queue_type", "triage")
      .eq("is_active", true)
      .single();

    if (queueError || !queueData) {
      console.error("Error finding triage queue:", queueError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Triage queue not found. Please contact administrator.",
      });
      return;
    }

    // Load tickets for triage queue
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
      console.log("Loaded triage queue tickets:", data);
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
      console.error("Error loading completed assessments:", error);
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
        description: "There are no patients in the triage queue.",
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
      loadTriageQueue();
    }
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Triage Queue</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="queue">Current Queue</TabsTrigger>
            <TabsTrigger value="completed">Today's Work ({completedToday.length})</TabsTrigger>
            <TabsTrigger value="previous">Previous Work ({previousWork.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {tickets.filter(t => t.status === "waiting").length} waiting
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {tickets.filter(t => t.status === "called").length} in assessment
                  </span>
                </div>
              </div>
              
              <Button onClick={callNext} size="lg">
                Call Next Patient
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Patient Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>MRN</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Wait Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => {
                      const waitTime = getWaitTime(ticket.created_at);
                      return (
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
                          <TableCell>{waitTime} min</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {ticket.status === "called" && (
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPatient({
                                      id: ticket.patient_id,
                                      name: `${ticket.patients.first_name} ${ticket.patients.last_name}`,
                                      ticketId: ticket.id
                                    });
                                    setShowTriageDialog(true);
                                  }}
                                >
                                  <Stethoscope className="h-4 w-4 mr-1" />
                                  Assess
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {tickets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No patients in the triage queue
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Completed Assessments Today</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, MRN, token..."
                      value={todaySearch}
                      onChange={(e) => {
                        setTodaySearch(e.target.value);
                        setTodayPage(1);
                      }}
                      className="pl-8"
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
                    {todaySearch ? "No matching assessments found" : "No assessments completed today yet"}
                  </div>
                )}

                {todayTotal > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {((todayPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(todayPage * ITEMS_PER_PAGE, todayTotal)} of {todayTotal} assessments
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Previous Assessments</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, MRN, token..."
                      value={previousSearch}
                      onChange={(e) => {
                        setPreviousSearch(e.target.value);
                        setPreviousPage(1);
                      }}
                      className="pl-8"
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
                    {previousSearch ? "No matching assessments found" : "No previous assessments found"}
                  </div>
                )}

                {previousTotal > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {((previousPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(previousPage * ITEMS_PER_PAGE, previousTotal)} of {previousTotal} assessments
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

      {/* Triage Assessment Dialog */}
      {selectedPatient && (
        <TriageAssessmentDialog
          open={showTriageDialog}
          onOpenChange={setShowTriageDialog}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          ticketId={selectedPatient.ticketId}
          onComplete={() => {
            setShowTriageDialog(false);
            loadTriageQueue();
            loadCompletedToday();
          }}
        />
      )}
    </div>
  );
};

export default TriageQueue;