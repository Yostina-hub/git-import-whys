import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

      // Auto-add to Triage queue
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
          patient_id: patientData.id,
          token_number: tokenNumber,
          status: "waiting",
          priority: "routine",
          notes: "Auto-added after registration",
        }]);

        toast({
          title: "Patient registered and queued",
          description: `MRN: ${mrn}. Token: ${tokenNumber}`,
        });
      } else {
        toast({
          title: "Patient registered successfully",
          description: `MRN: ${mrn}`,
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating patient",
        description: error.message,
      });
    }
    setLoading(false);
  };

  return (
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
  );
};
