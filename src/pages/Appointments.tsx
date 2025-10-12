import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Appointment {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  reason_for_visit?: string;
  patients: { first_name: string; last_name: string; mrn: string };
  profiles: { first_name: string; last_name: string };
  services: { name: string };
}

const Appointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: "",
    clinic_id: "",
    provider_id: "",
    service_id: "",
    scheduled_start: "",
    scheduled_end: "",
    reason_for_visit: "",
    source: "walk_in" as const,
  });

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadData = async () => {
    setLoading(true);
    
    const [apptRes, patRes, provRes, clinRes, svcRes] = await Promise.all([
      supabase
        .from("appointments")
        .select("*, patients(first_name, last_name, mrn), profiles(first_name, last_name), services(name)")
        .order("scheduled_start", { ascending: false }),
      supabase.from("patients").select("*").order("first_name"),
      supabase.from("profiles").select("*").order("first_name"),
      supabase.from("clinics").select("*").eq("is_active", true),
      supabase.from("services").select("*").eq("is_active", true),
    ]);

    if (apptRes.data) setAppointments(apptRes.data as any);
    if (patRes.data) setPatients(patRes.data);
    if (provRes.data) setProviders(provRes.data);
    if (clinRes.data) setClinics(clinRes.data);
    if (svcRes.data) setServices(svcRes.data);

    // Set default clinic
    if (clinRes.data && clinRes.data.length > 0) {
      setFormData(prev => ({ ...prev, clinic_id: clinRes.data[0].id }));
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("appointments").insert([
      {
        ...formData,
        created_by: user?.id,
        status: "booked",
      },
    ]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating appointment",
        description: error.message,
      });
    } else {
      toast({
        title: "Appointment created",
        description: "The appointment has been scheduled successfully.",
      });
      setIsDialogOpen(false);
      loadData();
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      booked: "bg-blue-500",
      confirmed: "bg-green-500",
      arrived: "bg-purple-500",
      in_progress: "bg-orange-500",
      completed: "bg-gray-500",
      cancelled: "bg-red-500",
      no_show: "bg-red-700",
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
          <h1 className="text-2xl font-bold">Appointment Management</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Appointments</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Schedule Appointment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient_id">Patient *</Label>
                      <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.mrn} - {p.first_name} {p.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="provider_id">Provider</Label>
                      <Select value={formData.provider_id} onValueChange={(value) => setFormData({ ...formData, provider_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.first_name} {p.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service_id">Service</Label>
                      <Select value={formData.service_id} onValueChange={(value) => setFormData({ ...formData, service_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} - ${s.unit_price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="scheduled_start">Start Date/Time *</Label>
                        <Input
                          id="scheduled_start"
                          type="datetime-local"
                          value={formData.scheduled_start}
                          onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scheduled_end">End Date/Time *</Label>
                        <Input
                          id="scheduled_end"
                          type="datetime-local"
                          value={formData.scheduled_end}
                          onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason_for_visit">Reason for Visit</Label>
                      <Textarea
                        id="reason_for_visit"
                        value={formData.reason_for_visit}
                        onChange={(e) => setFormData({ ...formData, reason_for_visit: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Scheduling..." : "Schedule Appointment"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell>
                      {new Date(appt.scheduled_start).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {appt.patients?.mrn} - {appt.patients?.first_name} {appt.patients?.last_name}
                    </TableCell>
                    <TableCell>
                      {appt.profiles?.first_name} {appt.profiles?.last_name}
                    </TableCell>
                    <TableCell>{appt.services?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(appt.status)}>
                        {appt.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {appointments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No appointments scheduled yet.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Appointments;
