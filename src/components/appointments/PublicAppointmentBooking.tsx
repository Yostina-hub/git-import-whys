import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, UserCheck, Users, Video, Stethoscope } from "lucide-react";
import { format, addMinutes, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const PublicAppointmentBooking = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [consultationType, setConsultationType] = useState<"online" | "in-person">("in-person");
  const [appointmentType, setAppointmentType] = useState<"doctor_specific" | "general">("general");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [providers, setProviders] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    patient_first_name: "",
    patient_last_name: "",
    patient_phone: "",
    patient_email: "",
    clinic_id: "",
    provider_id: "",
    service_id: "",
    reason_for_visit: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDate && formData.clinic_id) {
      generateTimeSlots();
    }
  }, [selectedDate, formData.clinic_id, formData.provider_id]);

  const loadData = async () => {
    const [clinRes, provRes, svcRes] = await Promise.all([
      supabase.from("clinics").select("*").eq("is_active", true),
      supabase.from("profiles").select("id, first_name, last_name, specialty").order("first_name"),
      supabase.from("services").select("*").eq("is_active", true).limit(20),
    ]);

    if (clinRes.data) {
      setClinics(clinRes.data);
      if (clinRes.data.length > 0) {
        setFormData(prev => ({ ...prev, clinic_id: clinRes.data[0].id }));
      }
    }
    if (provRes.data) setProviders(provRes.data);
    if (svcRes.data) setServices(svcRes.data);
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
        description: "Please select both date and time for your appointment",
      });
      return;
    }

    setLoading(true);

    // Combine date and time
    const [hours, minutes] = selectedTime.split(":");
    const scheduledStart = new Date(selectedDate);
    scheduledStart.setHours(parseInt(hours), parseInt(minutes), 0);
    const scheduledEnd = addMinutes(scheduledStart, 30);

    // For public bookings, we'll store appointment request data
    const appointmentData: any = {
      clinic_id: formData.clinic_id,
      scheduled_start: scheduledStart.toISOString(),
      scheduled_end: scheduledEnd.toISOString(),
      reason_for_visit: formData.reason_for_visit,
      source: "online",
      status: "booked",
      notes: JSON.stringify({
        patient_first_name: formData.patient_first_name,
        patient_last_name: formData.patient_last_name,
        patient_phone: formData.patient_phone,
        patient_email: formData.patient_email,
        appointment_type: appointmentType,
        consultation_type: consultationType,
      }),
    };

    // Add provider only if doctor-specific appointment
    if (appointmentType === "doctor_specific" && formData.provider_id) {
      appointmentData.provider_id = formData.provider_id;
    }

    if (formData.service_id) {
      appointmentData.service_id = formData.service_id;
    }

    // Note: In production, you'd want to check for existing patient by phone/email
    // and link to patient_id, or create a pending appointment request table
    
    const { error } = await supabase.from("appointments").insert([appointmentData]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Appointment Request Submitted!",
        description: "Our team will contact you shortly to confirm your appointment.",
      });
      
      // Reset form
      setFormData({
        patient_first_name: "",
        patient_last_name: "",
        patient_phone: "",
        patient_email: "",
        clinic_id: clinics[0]?.id || "",
        provider_id: "",
        service_id: "",
        reason_for_visit: "",
      });
      setSelectedDate(undefined);
      setSelectedTime("");
      setAppointmentType("general");
      setConsultationType("in-person");
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>Book an Appointment</CardTitle>
            <CardDescription>
              Schedule your visit with us - choose a specific doctor or book a general appointment
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Consultation Type Selection */}
          <div className="space-y-4">
            <Label>Consultation Type</Label>
            <RadioGroup value={consultationType} onValueChange={(v: any) => setConsultationType(v)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={cn(
                  "cursor-pointer transition-all",
                  consultationType === "in-person" && "border-primary ring-2 ring-primary"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="in-person" id="in-person" />
                      <Label htmlFor="in-person" className="flex items-center gap-2 cursor-pointer">
                        <Stethoscope className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-semibold">In-Person Visit</div>
                          <div className="text-xs text-muted-foreground">
                            Visit the clinic physically
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardHeader>
                </Card>

                <Card className={cn(
                  "cursor-pointer transition-all",
                  consultationType === "online" && "border-primary ring-2 ring-primary"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer">
                        <Video className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-semibold">Online Consultation</div>
                          <div className="text-xs text-muted-foreground">
                            Video/audio consultation
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </RadioGroup>
          </div>

          {/* Appointment Type Selection */}
          <div className="space-y-4">
            <Label>Appointment Type</Label>
            <RadioGroup value={appointmentType} onValueChange={(v: any) => setAppointmentType(v)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={cn(
                  "cursor-pointer transition-all",
                  appointmentType === "general" && "border-primary ring-2 ring-primary"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="general" id="general" />
                      <Label htmlFor="general" className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-semibold">General Appointment</div>
                          <div className="text-xs text-muted-foreground">
                            Visit any available doctor
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
                      <RadioGroupItem value="doctor_specific" id="doctor_specific" />
                      <Label htmlFor="doctor_specific" className="flex items-center gap-2 cursor-pointer">
                        <UserCheck className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-semibold">Specific Doctor</div>
                          <div className="text-xs text-muted-foreground">
                            Choose your preferred doctor
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </RadioGroup>
          </div>

          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient_first_name">First Name *</Label>
                <Input
                  id="patient_first_name"
                  value={formData.patient_first_name}
                  onChange={(e) => setFormData({ ...formData, patient_first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="patient_last_name">Last Name *</Label>
                <Input
                  id="patient_last_name"
                  value={formData.patient_last_name}
                  onChange={(e) => setFormData({ ...formData, patient_last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient_phone">Phone Number *</Label>
                <Input
                  id="patient_phone"
                  type="tel"
                  value={formData.patient_phone}
                  onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="patient_email">Email</Label>
                <Input
                  id="patient_email"
                  type="email"
                  value={formData.patient_email}
                  onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Appointment Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinic_id">Clinic *</Label>
                <Select value={formData.clinic_id} onValueChange={(value) => setFormData({ ...formData, clinic_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {appointmentType === "doctor_specific" && (
                <div>
                  <Label htmlFor="provider_id">Preferred Doctor *</Label>
                  <Select 
                    value={formData.provider_id} 
                    onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.first_name} {provider.last_name}
                          {provider.specialty && ` - ${provider.specialty}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="service_id">Service</Label>
                <Select value={formData.service_id} onValueChange={(value) => setFormData({ ...formData, service_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ${service.unit_price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Preferred Date *</Label>
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

              <div>
                <Label htmlFor="time_slot">Preferred Time *</Label>
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

            <div>
              <Label htmlFor="reason_for_visit">Reason for Visit</Label>
              <Textarea
                id="reason_for_visit"
                placeholder="Please describe the reason for your visit..."
                value={formData.reason_for_visit}
                onChange={(e) => setFormData({ ...formData, reason_for_visit: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Note:</strong> This is an appointment request. Our team will contact you to confirm 
              your appointment within 24 hours. For urgent matters, please call our clinic directly.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={loading} size="lg">
              {loading ? "Submitting..." : "Request Appointment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};