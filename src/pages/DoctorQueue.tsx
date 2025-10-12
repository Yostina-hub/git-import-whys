import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, AlertCircle, Clock, FileText, Stethoscope, Pill, TestTube } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DoctorQueue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientDialog, setShowPatientDialog] = useState(false);

  useEffect(() => {
    checkAuth();
    loadDoctorQueue();
  }, []);

  useEffect(() => {
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      loadDoctorQueue();
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
    setShowPatientDialog(true);
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

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Consultation completed",
        description: "Patient marked as served",
      });
      setShowPatientDialog(false);
      loadDoctorQueue();
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
          <h1 className="text-2xl font-bold">Doctor Queue</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
                {tickets.filter(t => t.status === "called").length} in consultation
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => viewPatient(ticket)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {ticket.status === "called" && (
                            <Button 
                              size="sm"
                              onClick={() => completeConsultation(ticket.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
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
                No patients in the doctor queue
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Patient Consultation
            </DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">MRN</p>
                    <p className="font-medium">{selectedPatient.mrn}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{new Date(selectedPatient.date_of_birth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Age</p>
                    <p className="font-medium">
                      {Math.floor((new Date().getTime() - new Date(selectedPatient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate(`/clinical?patient=${selectedPatient.id}`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Clinical Record
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate(`/orders?patient=${selectedPatient.id}`)}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </div>

              {/* Quick Consultation Note */}
              <div className="space-y-2">
                <Label htmlFor="quick-note">Quick Consultation Note</Label>
                <Textarea 
                  id="quick-note"
                  placeholder="Enter consultation notes..."
                  rows={6}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowPatientDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  const ticket = tickets.find(t => t.patients.id === selectedPatient.id);
                  if (ticket) completeConsultation(ticket.id);
                }}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Consultation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorQueue;
