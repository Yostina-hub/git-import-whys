import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SignatureCanvas from "react-signature-canvas";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  onSuccess: () => void;
  onCancel: () => void;
}

export const PatientRegistrationForm = ({ 
  registrationServiceId, 
  registrationPrice,
  onSuccess, 
  onCancel 
}: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);
  const [consentType, setConsentType] = useState<"general_treatment" | "package_treatment" | "data_privacy" | "telehealth" | "photography" | "research">("general_treatment");
  const [signedBy, setSignedBy] = useState("patient");
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const signaturePadRef = useRef<SignatureCanvas>(null);
  
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    sex_at_birth: "male",
    phone_mobile: "",
    phone_alt: "",
    email: "",
    national_id: "",
    address_line1: "",
    city: "",
    country: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: mrnData } = await supabase.rpc("generate_mrn");
      const mrn = mrnData || `MRN${Date.now()}`;

      const { data: { user } } = await supabase.auth.getUser();

      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert([{ ...formData, mrn }])
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
        title: "Patient registered successfully",
        description: `MRN: ${mrn}. Please complete consent form.`,
      });

      // Store patient data and show consent dialog
      setRegisteredPatient({ ...patientData, mrn });
      setShowConsentDialog(true);
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating patient",
        description: error.message,
      });
      setLoading(false);
    }
  };

  const handleConsentSubmit = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      toast({
        variant: "destructive",
        title: "Signature required",
        description: "Please provide a signature to consent.",
      });
      return;
    }

    if (!registeredPatient) return;

    setLoading(true);

    try {
      const signatureData = signaturePadRef.current.toDataURL();

      // Save consent form
      const { error: consentError } = await supabase.from("consent_forms").insert([{
        patient_id: registeredPatient.id,
        consent_type: consentType,
        signed_by: signedBy,
        guardian_name: signedBy === "guardian" ? guardianName : null,
        guardian_relationship: signedBy === "guardian" ? guardianRelationship : null,
        signed_at: new Date().toISOString(),
        signature_blob: signatureData,
      }]);

      if (consentError) throw consentError;

      // Now add to triage queue
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
          notes: "Auto-added after registration and consent",
        }]);

        toast({
          title: "Consent recorded and patient queued",
          description: `Token: ${tokenNumber}`,
        });
      } else {
        toast({
          title: "Consent recorded successfully",
        });
      }

      setShowConsentDialog(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error recording consent",
        description: error.message,
      });
    }
    setLoading(false);
  };

  const getConsentContent = () => {
    const patientName = registeredPatient 
      ? `${registeredPatient.first_name} ${registeredPatient.last_name}` 
      : "";
    
    switch (consentType) {
      case "general_treatment":
        return `I, ${patientName}, hereby consent to receive medical examination, diagnostic procedures, and treatment as deemed necessary by the healthcare providers at this facility. I understand the nature and purpose of the proposed treatment, potential risks, benefits, and alternatives.`;
      case "package_treatment":
        return `I, ${patientName}, give my informed consent to undergo the treatment package as explained to me. I understand the components, risks, benefits, and alternatives.`;
      case "data_privacy":
        return `I, ${patientName}, authorize the healthcare facility to collect, store, and share my medical information as necessary for treatment, billing, and healthcare operations in accordance with applicable privacy laws.`;
      case "telehealth":
        return `I, ${patientName}, consent to receive healthcare services via telehealth. I understand the limitations and benefits of virtual consultations and agree to proceed.`;
      case "photography":
        return `I, ${patientName}, consent to photography or video recording for medical documentation purposes.`;
      case "research":
        return `I, ${patientName}, consent to the use of my medical data for research purposes in accordance with ethical guidelines.`;
      default:
        return "";
    }
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

      <Dialog open={showConsentDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consent Form Required</DialogTitle>
            <DialogDescription>
              Before proceeding with treatment, we need the patient's consent. Please complete the form below.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This consent form must be completed before the patient can be added to the queue.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient Information</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">
                  {registeredPatient?.first_name} {registeredPatient?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">MRN: {registeredPatient?.mrn}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Consent Type</Label>
              <Select value={consentType} onValueChange={(value: any) => setConsentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_treatment">General Treatment</SelectItem>
                  <SelectItem value="package_treatment">Package Treatment</SelectItem>
                  <SelectItem value="data_privacy">Data Privacy</SelectItem>
                  <SelectItem value="telehealth">Telehealth</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Signed By</Label>
              <Select value={signedBy} onValueChange={setSignedBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="guardian">Guardian/Representative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {signedBy === "guardian" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Guardian Name *</Label>
                  <Input
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relationship *</Label>
                  <Input
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                    placeholder="e.g., Parent, Spouse"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Consent Content</Label>
              <div className="p-4 bg-muted rounded-md text-sm">
                {getConsentContent()}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Signature *</Label>
              <div className="border-2 border-dashed rounded-md">
                <SignatureCanvas
                  ref={signaturePadRef}
                  canvasProps={{
                    className: "w-full h-40",
                  }}
                />
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => signaturePadRef.current?.clear()}
              >
                Clear Signature
              </Button>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowConsentDialog(false);
                  onCancel();
                }}
                className="flex-1"
              >
                Cancel Registration
              </Button>
              <Button
                type="button"
                onClick={handleConsentSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Processing..." : "Submit Consent & Queue Patient"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
