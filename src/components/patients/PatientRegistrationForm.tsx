import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConsentFormDialog } from "@/components/clinical/ConsentFormDialog";
import { AppointmentBookingFlow } from "./AppointmentBookingFlow";

interface PatientFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  sex_at_birth: "male" | "female";
  phone_mobile: string;
  phone_alt: string;
  email: string;
  national_id: string;
  address_line1: string;
  city: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

interface Props {
  registrationServiceId: string;
  registrationPrice: number;
  consultationServiceId?: string;
  consultationPrice?: number;
  onSuccess: () => void;
  onCancel: () => void;
  onAppointmentPath?: (patientData: any) => void;
  existingPatient?: any; // For resuming incomplete registrations
}

export const PatientRegistrationForm = ({ 
  registrationServiceId, 
  registrationPrice,
  consultationServiceId,
  consultationPrice,
  onSuccess, 
  onCancel,
  onAppointmentPath,
  existingPatient
}: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [showPathSelection, setShowPathSelection] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "insurance" | "mobile_money">("cash");
  const [paymentReference, setPaymentReference] = useState("");
  
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: existingPatient?.first_name || "",
    middle_name: existingPatient?.middle_name || "",
    last_name: existingPatient?.last_name || "",
    date_of_birth: existingPatient?.date_of_birth || "",
    sex_at_birth: existingPatient?.sex_at_birth || "male",
    phone_mobile: existingPatient?.phone_mobile || "",
    phone_alt: existingPatient?.phone_alt || "",
    email: existingPatient?.email || "",
    national_id: existingPatient?.national_id || "",
    address_line1: existingPatient?.address_line1 || "",
    city: existingPatient?.city || "",
    country: existingPatient?.country || "",
    emergency_contact_name: existingPatient?.emergency_contact_name || "",
    emergency_contact_phone: existingPatient?.emergency_contact_phone || "",
  });

  // If resuming, check what step to start from
  useState(() => {
    if (existingPatient) {
      setRegisteredPatient(existingPatient);
      
      // Resume based on status
      if (existingPatient.registration_status === 'pending') {
        setShowConsentDialog(true);
      } else if (existingPatient.registration_status === 'consented') {
        setShowPathSelection(true);
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If resuming existing patient, skip to consent
      if (existingPatient) {
        setRegisteredPatient(existingPatient);
        setShowConsentDialog(true);
        setLoading(false);
        return;
      }

      const { data: mrnData } = await supabase.rpc("generate_mrn");
      const mrn = mrnData || `MRN${Date.now()}`;

      const { data: { user } } = await supabase.auth.getUser();

      // Auto-save patient record with pending status
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert([{ 
          ...formData, 
          mrn,
          registration_status: 'pending',
          registration_notes: 'Registration started - awaiting consent'
        }])
        .select()
        .single();

      if (patientError) throw patientError;

      // Create registration invoice
      const invoiceData = {
        patient_id: patientData.id,
        status: "issued" as const,
        subtotal: registrationPrice,
        tax_amount: 0,
        total_amount: registrationPrice,
        balance_due: registrationPrice,
        issued_at: new Date().toISOString(),
        created_by: user?.id,
        lines: [{
          service_id: registrationServiceId,
          description: "Patient Registration Fee",
          quantity: 1,
          unit_price: registrationPrice,
          total: registrationPrice,
          item_type: "service",
        }],
      };

      await supabase.from("invoices").insert([invoiceData]);

      toast({
        title: "Patient record saved",
        description: `MRN: ${mrn}. Progress saved - please complete consent.`,
      });

      // Store patient data and show consent dialog
      setRegisteredPatient({ ...patientData, mrn });
      setShowConsentDialog(true);
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving patient",
        description: error.message,
      });
      setLoading(false);
    }
  };

  const handleConsentSuccess = async () => {
    // Update patient status to consented
    if (registeredPatient) {
      await supabase
        .from("patients")
        .update({ 
          registration_status: 'consented',
          consent_completed_at: new Date().toISOString(),
          registration_notes: 'Consent completed - awaiting payment path selection'
        })
        .eq("id", registeredPatient.id);
    }
    
    // After consent is recorded, show path selection dialog
    setShowConsentDialog(false);
    setShowPathSelection(true);
  };

  const handleDirectConsultation = async () => {
    if (!consultationServiceId || !consultationPrice) {
      toast({
        variant: "destructive",
        title: "Configuration error",
        description: "Consultation service not configured",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Create consultation invoice
      const invoiceData = {
        patient_id: registeredPatient.id,
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

      setCurrentInvoiceId(invoice.id);
      setPaymentAmount(consultationPrice.toString());
      setShowPathSelection(false);
      setShowPaymentDialog(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating consultation invoice",
        description: error.message,
      });
    }
    setLoading(false);
  };

  const handleAppointmentPath = () => {
    setShowPathSelection(false);
    setShowAppointmentDialog(true);
  };

  const handleAppointmentPaymentRequired = (invoiceId: string, amount: number) => {
    setCurrentInvoiceId(invoiceId);
    setPaymentAmount(amount.toString());
    setShowAppointmentDialog(false);
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    if (!currentInvoiceId || !paymentAmount) {
      toast({
        variant: "destructive",
        title: "Invalid payment",
        description: "Please enter payment amount",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Record payment
      const { error: paymentError } = await supabase.from("payments").insert([{
        invoice_id: currentInvoiceId,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        transaction_ref: paymentReference || null,
        received_by: user?.id,
        received_at: new Date().toISOString(),
      }]);

      if (paymentError) throw paymentError;

      // Now add to triage queue automatically
      const { data: triageQueue } = await supabase
        .from("queues")
        .select("id")
        .eq("queue_type", "triage")
        .eq("is_active", true)
        .maybeSingle();

      if (triageQueue) {
        const { data: tokenData } = await supabase.rpc("generate_ticket_token", {
          queue_prefix: "Q"
        });
        const tokenNumber = tokenData || `Q${Date.now()}`;

        await supabase.from("tickets").insert([{
          queue_id: triageQueue.id,
          patient_id: registeredPatient.id,
          token_number: tokenNumber,
          status: "waiting",
          priority: "routine",
          notes: "Added after payment confirmation",
        }]);

      // Mark registration as completed
      await supabase
        .from("patients")
        .update({ 
          registration_status: 'completed',
          payment_completed_at: new Date().toISOString(),
          registration_notes: 'Registration completed successfully'
        })
        .eq("id", registeredPatient.id);

      toast({
        title: "Payment recorded and patient queued",
        description: `Token: ${tokenNumber}. Patient transferred to triage.`,
      });
      } else {
        toast({
          title: "Payment recorded successfully",
          description: "Patient ready for triage",
        });
      }

      setShowPaymentDialog(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error recording payment",
        description: error.message,
      });
    }
    setLoading(false);
  };


  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sex_at_birth">Gender *</Label>
            <Select value={formData.sex_at_birth} onValueChange={(value: any) => setFormData({ ...formData, sex_at_birth: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone_mobile">Mobile Phone *</Label>
            <Input
              id="phone_mobile"
              type="tel"
              value={formData.phone_mobile}
              onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address_line1">Address</Label>
          <Input
            id="address_line1"
            value={formData.address_line1}
            onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
            <Input
              id="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? "Registering..." : "Register Patient"}
          </Button>
        </div>
      </form>

      {registeredPatient && (
        <ConsentFormDialog
          open={showConsentDialog}
          onOpenChange={setShowConsentDialog}
          patientId={registeredPatient.id}
          onSuccess={handleConsentSuccess}
        />
      )}

      <Dialog open={showPathSelection} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Workflow Path</DialogTitle>
            <DialogDescription>
              Choose how you would like to proceed with this patient
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Patient: {registeredPatient?.first_name} {registeredPatient?.last_name} (MRN: {registeredPatient?.mrn})
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                onClick={handleDirectConsultation}
                disabled={loading || !consultationServiceId}
                className="w-full justify-start h-auto py-4"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-semibold">Path A: Direct Consultation</div>
                  <div className="text-sm text-muted-foreground">
                    Pay consultation fee → Triage → Doctor
                  </div>
                </div>
              </Button>

              <Button
                onClick={handleAppointmentPath}
                disabled={loading}
                className="w-full justify-start h-auto py-4"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-semibold">Path B: Book Appointment</div>
                  <div className="text-sm text-muted-foreground">
                    Create appointment → Invoice → Pay → Triage
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {registeredPatient && consultationServiceId && consultationPrice && (
        <AppointmentBookingFlow
          open={showAppointmentDialog}
          onOpenChange={setShowAppointmentDialog}
          patientId={registeredPatient.id}
          patientName={`${registeredPatient.first_name} ${registeredPatient.last_name}`}
          consultationServiceId={consultationServiceId}
          consultationPrice={consultationPrice}
          onPaymentRequired={handleAppointmentPaymentRequired}
        />
      )}

      <Dialog open={showPaymentDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Payment will automatically queue patient for triage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Optional transaction reference"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setShowPathSelection(true);
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handlePaymentSubmit}
                disabled={loading || !paymentAmount}
                className="flex-1"
              >
                {loading ? "Processing..." : "Record Payment & Queue"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
