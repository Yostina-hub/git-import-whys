import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar as CalendarIcon, Plus, UserCheck, Users, Clock, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, setHours, setMinutes, startOfToday, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppointmentFilters } from "@/components/appointments/AppointmentFilters";
import { AppointmentStats } from "@/components/appointments/AppointmentStats";
import { AppointmentCalendarView } from "@/components/appointments/AppointmentCalendarView";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { useRealtimeAppointments } from "@/hooks/useRealtimeAppointments";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CardHeader } from "@/components/ui/card";

interface Appointment {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  reason_for_visit?: string;
  patients: { first_name: string; last_name: string; mrn: string };
  profiles?: { first_name: string; last_name: string } | null;
  services?: { name: string } | null;
  clinics?: { name: string } | null;
}

const Appointments = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clinicFilter, setClinicFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState({
    patient_id: "",
    clinic_id: "",
    provider_id: "",
    service_id: "",
    reason_for_visit: "",
    source: "walk_in" as const,
  });


  const handleAppointmentUpdate = () => {
    loadData();
  };

  // Real-time updates
  useRealtimeAppointments({ onAppointmentUpdate: handleAppointmentUpdate });

  useEffect(() => {
    checkAuth();
    loadData();
    
    // Check if coming from registration with pre-filled patient
    if (location.state?.fromRegistration && location.state?.prefilledPatientId) {
      setFormData(prev => ({ 
        ...prev, 
        patient_id: location.state.prefilledPatientId 
      }));
      setIsDialogOpen(true);
      
      // Clear the navigation state to prevent re-opening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
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
        .select("*, patients!inner(first_name, last_name, mrn), services(name), clinics(name)")
        .order("scheduled_start", { ascending: false })
        .limit(500),
      supabase.from("patients").select("id, first_name, last_name, mrn").order("first_name").limit(100),
      supabase.from("profiles").select("id, first_name, last_name").order("first_name"),
      supabase.from("clinics").select("*").eq("is_active", true),
      supabase.from("services").select("*").eq("is_active", true),
    ]);

    if (apptRes.data) {
      // Fetch provider names separately for appointments that have providers
      const appointmentsWithProviders = await Promise.all(
        apptRes.data.map(async (apt: any) => {
          if (apt.provider_id) {
            const { data: provider } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", apt.provider_id)
              .single();
            return { ...apt, profiles: provider };
          }
          return { ...apt, profiles: null };
        })
      );
      setAppointments(appointmentsWithProviders as any);
    }
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

    try {
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
      
      const { data: appointment, error: apptError } = await supabase
        .from("appointments")
        .insert([appointmentData])
        .select()
        .single();

      if (apptError) throw apptError;

      // Create invoice for the appointment
      const consultationService = services.find(s => s.code === 'CONSULT');
      if (consultationService) {
        const invoiceData = {
          patient_id: formData.patient_id,
          appointment_id: appointment.id,
          status: "issued" as const,
          subtotal: consultationService.unit_price,
          tax_amount: 0,
          total_amount: consultationService.unit_price,
          balance_due: consultationService.unit_price,
          issued_at: new Date().toISOString(),
          created_by: user?.id,
          lines: [{
            service_id: consultationService.id,
            description: consultationService.name,
            quantity: 1,
            unit_price: consultationService.unit_price,
            total: consultationService.unit_price,
            item_type: "service",
          }],
        };

        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert([invoiceData])
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Update patient registration notes
        await supabase
          .from("patients")
          .update({ 
            registration_notes: `Path B selected - Invoice #${invoice.id} sent to billing department`
          })
          .eq("id", formData.patient_id);

        toast({
          title: "Success",
          description: "Appointment created and sent to billing department for payment processing.",
        });
      } else {
        toast({
          title: "Appointment created",
          description: "The appointment has been scheduled successfully.",
        });
      }

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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating appointment",
        description: error.message,
      });
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const validStatuses = ["booked", "confirmed", "arrived", "in_progress", "completed", "cancelled", "no_show", "rescheduled"];
      if (!validStatuses.includes(newStatus)) {
        throw new Error("Invalid status");
      }

      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus as any })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Appointment status changed to ${newStatus.replace("_", " ")}`,
      });
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: error.message,
      });
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      searchTerm === "" ||
      `${apt.patients.first_name} ${apt.patients.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patients.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesClinic = clinicFilter === "all" || apt.clinics?.name === clinics.find(c => c.id === clinicFilter)?.name;
    const matchesProvider = 
      providerFilter === "all" || 
      (providerFilter === "unassigned" && !apt.profiles) ||
      (apt.profiles && providers.find(p => p.id === providerFilter && 
        `${p.first_name} ${p.last_name}` === `${apt.profiles?.first_name} ${apt.profiles?.last_name}`));

    return matchesSearch && matchesStatus && matchesClinic && matchesProvider;
  });

  // Calculate stats
  const stats = {
    total: appointments.length,
    booked: appointments.filter(a => a.status === "booked").length,
    completed: appointments.filter(a => a.status === "completed").length,
    cancelled: appointments.filter(a => a.status === "cancelled").length,
    today: appointments.filter(a => {
      const aptDate = new Date(a.scheduled_start);
      const today = startOfToday();
      return aptDate.toDateString() === today.toDateString();
    }).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Appointments</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Manage patient appointments</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => loadData()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading appointments...</p>
              </div>
            </CardContent>
          </Card>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold">No appointments scheduled</h3>
                <p className="text-sm text-muted-foreground">Create your first appointment to get started</p>
                <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Grid */}
            <AppointmentStats stats={stats} />

            {/* Filters */}
            <Card className="border-2">
              <CardContent className="p-4">
                <AppointmentFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  clinicFilter={clinicFilter}
                  onClinicFilterChange={setClinicFilter}
                  providerFilter={providerFilter}
                  onProviderFilterChange={setProviderFilter}
                  clinics={clinics}
                  providers={providers}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  totalAppointments={appointments.length}
                  filteredCount={filteredAppointments.length}
                />
              </CardContent>
            </Card>

            {/* Calendar View Navigation */}
            {viewMode === "calendar" && (
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold">
                      {format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appointments Display */}
            {viewMode === "calendar" ? (
              <Card className="border-2">
                <CardContent className="p-4">
                  <AppointmentCalendarView
                    appointments={filteredAppointments}
                    currentMonth={currentMonth}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAppointments.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Appointments;