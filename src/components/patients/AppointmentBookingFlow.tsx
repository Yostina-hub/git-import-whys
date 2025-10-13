import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  consultationServiceId: string;
  consultationPrice: number;
  onPaymentRequired: (invoiceId: string, amount: number) => void;
}

export const AppointmentBookingFlow = ({
  open,
  onOpenChange,
  patientId,
  patientName,
  consultationServiceId,
  consultationPrice,
  onPaymentRequired,
}: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"appointment" | "invoice">("appointment");
  
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [reason, setReason] = useState("Initial Consultation");
  
  const [clinics, setClinics] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);

  // Load clinics and providers on mount
  useState(() => {
    const loadData = async () => {
      const { data: clinicsData } = await supabase
        .from("clinics")
        .select("id, name")
        .eq("is_active", true);
      
      const { data: providersData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .limit(50);

      if (clinicsData) setClinics(clinicsData);
      if (providersData) setProviders(providersData);
    };
    loadData();
  });

  const handleCreateAppointment = async () => {
    if (!selectedDate || !selectedTime || !clinicId) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill all required fields",
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
      
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + 30); // 30 min default

      // Create appointment
      const { data: appointment, error: apptError } = await supabase
        .from("appointments")
        .insert([{
          patient_id: patientId,
          clinic_id: clinicId,
          provider_id: providerId || null,
          service_id: consultationServiceId,
          scheduled_start: scheduledStart.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          reason_for_visit: reason,
          status: "booked",
          created_by: user?.id,
        }])
        .select()
        .single();

      if (apptError) throw apptError;

      toast({
        title: "Appointment created",
        description: `Scheduled for ${format(scheduledStart, "PPp")}`,
      });

      // Now create invoice
      setStep("invoice");
      await handleCreateInvoice(appointment.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating appointment",
        description: error.message,
      });
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (appointmentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const invoiceData = {
        patient_id: patientId,
        appointment_id: appointmentId,
        status: "issued" as const,
        subtotal: consultationPrice,
        tax_amount: 0,
        total_amount: consultationPrice,
        balance_due: consultationPrice,
        issued_at: new Date().toISOString(),
        created_by: user?.id,
        lines: [{
          service_id: consultationServiceId,
          description: "Initial Consultation",
          quantity: 1,
          unit_price: consultationPrice,
          total: consultationPrice,
          item_type: "service",
        }],
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      toast({
        title: "Invoice created",
        description: "Please proceed to payment",
      });

      // Trigger payment flow
      onPaymentRequired(invoice.id, consultationPrice);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating invoice",
        description: error.message,
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Creating appointment for {patientName}
          </DialogDescription>
        </DialogHeader>

        {step === "appointment" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Clinic *</Label>
              <Select value={clinicId} onValueChange={setClinicId}>
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

            <div className="space-y-2">
              <Label>Provider (Optional)</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.first_name} {provider.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time *</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Initial Consultation"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAppointment}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create & Invoice"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
