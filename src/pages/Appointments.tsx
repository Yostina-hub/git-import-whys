import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar as CalendarIcon, Plus, UserCheck, Users, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addMinutes, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [appointmentType, setAppointmentType] = useState<"doctor_specific" | "general">("general");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    patient_id: "",
    clinic_id: "",
    provider_id: "",
    service_id: "",
    reason_for_visit: "",
    source: "walk_in" as const,
  });

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDate && formData.clinic_id) {
      generateTimeSlots();
    }
  }, [selectedDate, formData.clinic_id, formData.provider_id]);

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
        .select("*, patients!inner(first_name, last_name, mrn), profiles!inner(first_name, last_name), services!inner(name)")
        .order("scheduled_start", { ascending: false })
        .limit(100),
      supabase.from("patients").select("id, first_name, last_name, mrn").order("first_name").limit(100),
      supabase.from("profiles").select("id, first_name, last_name").order("first_name"),
      supabase.from("clinics").select("*").eq("is_active", true),
      supabase.from("services").select("*").eq("is_active", true),
    ]);

    if (apptRes.data) setAppointments(apptRes.data as any);
    if (patRes.data) setPatients(patRes.data);
    if (provRes.data) setProviders(provRes.data);
    if (clinRes.data) setClinics(clinRes.data);
    if (svcRes.data) setServices(svcRes.data);

    if (clinRes.data && clinRes.data.length > 0) {
      setFormData(prev => ({ ...prev, clinic_id: clinRes.data[0].id }));
    }

    setLoading(false);
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    const startHour = 8; // 8 AM
    const endHour = 17; // 5 PM
    const interval = 30; // 30 minutes

    let currentTime = setMinutes(setHours(new Date(), startHour), 0);
    const endTime = setMinutes(setHours(new Date(), endHour), 0);

    while (currentTime <= endTime) {
      slots.push(format(currentTime, "HH:mm"));
      currentTime = addMinutes(currentTime, interval);
    }

    setAvailableTimeSlots(slots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select both date and time for the appointment",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    // Combine date and time
    const [hours, minutes] = selectedTime.split(":");
    const scheduledStart = new Date(selectedDate);
    scheduledStart.setHours(parseInt(hours), parseInt(minutes), 0);
    const scheduledEnd = addMinutes(scheduledStart, 30);

    const appointmentData: any = {
      patient_id: formData.patient_id,
      clinic_id: formData.clinic_id,
      service_id: formData.service_id || null,
      scheduled_start: scheduledStart.toISOString(),
      scheduled_end: scheduledEnd.toISOString(),
      reason_for_visit: formData.reason_for_visit,
      source: formData.source,
      created_by: user?.id,
      status: "booked",
    };

    // Only add provider if doctor-specific appointment
    if (appointmentType === "doctor_specific" && formData.provider_id) {
      appointmentData.provider_id = formData.provider_id;
    }
    
    const { error } = await supabase.from("appointments").insert([appointmentData]);

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
      setSelectedDate(undefined);
      setSelectedTime("");
      setFormData({
        patient_id: "",
        clinic_id: clinics[0]?.id || "",
        provider_id: "",
        service_id: "",
        reason_for_visit: "",
        source: "walk_in",
      });
      setAppointmentType("general");
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Schedule New Appointment</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Appointment Type Selection */}
                    <div className="space-y-4">
                      <Label>Appointment Type</Label>
                      <RadioGroup value={appointmentType} onValueChange={(v: any) => {
                        setAppointmentType(v);
                        if (v === "general") {
                          setFormData({ ...formData, provider_id: "" });
                        }
                      }}>
                        <div className="grid grid-cols-2 gap-4">
                          <Card className={cn(
                            "cursor-pointer transition-all",
                            appointmentType === "general" && "border-primary ring-2 ring-primary"
                          )}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="general" id="general-staff" />
                                <Label htmlFor="general-staff" className="flex items-center gap-2 cursor-pointer flex-1">
                                  <Users className="h-5 w-5 text-primary" />
                                  <div>
                                    <div className="font-semibold">General Appointment</div>
                                    <div className="text-xs text-muted-foreground">
                                      Any available doctor
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            </CardHeader>
                          </Card>

                          <Card className={cn(
                            "cursor-pointer transition-all",
                            appointmentType === "doctor_specific" && "border-primary ring-2 ring-primary"
                          )}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="doctor_specific" id="doctor_specific-staff" />
                                <Label htmlFor="doctor_specific-staff" className="flex items-center gap-2 cursor-pointer flex-1">
                                  <UserCheck className="h-5 w-5 text-primary" />
                                  <div>
                                    <div className="font-semibold">Specific Doctor</div>
                                    <div className="text-xs text-muted-foreground">
                                      Assign to doctor
                                    </div>
                                  </div>
                                </Label>
                              </div>
                            </CardHeader>
                          </Card>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="clinic_id">Clinic *</Label>
                        <Select value={formData.clinic_id} onValueChange={(value) => setFormData({ ...formData, clinic_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select clinic" />
                          </SelectTrigger>
                          <SelectContent>
                            {clinics.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {appointmentType === "doctor_specific" && (
                      <div className="space-y-2">
                        <Label htmlFor="provider_id">Assigned Doctor *</Label>
                        <Select value={formData.provider_id} onValueChange={(value) => setFormData({ ...formData, provider_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select doctor" />
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
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="service_id">Service</Label>
                      <Select value={formData.service_id} onValueChange={(value) => setFormData({ ...formData, service_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service (optional)" />
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
                        <Label>Appointment Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              disabled={(date) => date < new Date() || date.getDay() === 0}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="time_slot">Appointment Time *</Label>
                        <Select value={selectedTime} onValueChange={setSelectedTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time">
                              {selectedTime && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {selectedTime}
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableTimeSlots.map((slot) => (
                              <SelectItem key={slot} value={slot}>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {slot}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="source">Appointment Source</Label>
                      <Select value={formData.source} onValueChange={(value: any) => setFormData({ ...formData, source: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walk_in">Walk-in</SelectItem>
                          <SelectItem value="online">Online Booking</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason_for_visit">Reason for Visit</Label>
                      <Textarea
                        id="reason_for_visit"
                        value={formData.reason_for_visit}
                        onChange={(e) => setFormData({ ...formData, reason_for_visit: e.target.value })}
                        placeholder="Brief description of the visit reason..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Scheduling..." : "Schedule Appointment"}
                      </Button>
                    </div>
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
                      {appt.profiles ? `${appt.profiles.first_name} ${appt.profiles.last_name}` : "Any Available"}
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