import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditPatientDialogProps {
  patient: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditPatientDialog({
  patient,
  open,
  onOpenChange,
  onSuccess,
}: EditPatientDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    sex_at_birth: "male",
    gender_identity: "prefer_not_to_say",
    phone_mobile: "",
    phone_alt: "",
    email: "",
    national_id: "",
    passport_no: "",
    sonik_id: "",
    address_line1: "",
    address_line2: "",
    city: "",
    region: "",
    postal_code: "",
    country: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    preferred_language: "en",
  });

  useEffect(() => {
    if (patient && open) {
      setFormData({
        first_name: patient.first_name || "",
        middle_name: patient.middle_name || "",
        last_name: patient.last_name || "",
        date_of_birth: patient.date_of_birth || "",
        sex_at_birth: patient.sex_at_birth || "male",
        gender_identity: patient.gender_identity || "prefer_not_to_say",
        phone_mobile: patient.phone_mobile || "",
        phone_alt: patient.phone_alt || "",
        email: patient.email || "",
        national_id: patient.national_id || "",
        passport_no: patient.passport_no || "",
        sonik_id: patient.sonik_id || "",
        address_line1: patient.address_line1 || "",
        address_line2: patient.address_line2 || "",
        city: patient.city || "",
        region: patient.region || "",
        postal_code: patient.postal_code || "",
        country: patient.country || "",
        emergency_contact_name: patient.emergency_contact_name || "",
        emergency_contact_phone: patient.emergency_contact_phone || "",
        emergency_contact_relationship: patient.emergency_contact_relationship || "",
        preferred_language: patient.preferred_language || "en",
      });
    }
  }, [patient, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("patients")
        .update(formData)
        .eq("id", patient.id);

      if (error) throw error;

      toast({
        title: "Patient updated",
        description: "Patient information has been updated successfully",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating patient",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Patient Information</DialogTitle>
          <DialogDescription>
            Update patient details. MRN: {patient?.mrn}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="emergency">Emergency</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleChange("first_name", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input
                      id="middle_name"
                      value={formData.middle_name}
                      onChange={(e) => handleChange("middle_name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleChange("last_name", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleChange("date_of_birth", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sex_at_birth">Sex at Birth *</Label>
                    <Select
                      value={formData.sex_at_birth}
                      onValueChange={(value) => handleChange("sex_at_birth", value)}
                    >
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="national_id">National ID</Label>
                    <Input
                      id="national_id"
                      value={formData.national_id}
                      onChange={(e) => handleChange("national_id", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="passport_no">Passport No</Label>
                    <Input
                      id="passport_no"
                      value={formData.passport_no}
                      onChange={(e) => handleChange("passport_no", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sonik_id">SONIK ID</Label>
                    <Input
                      id="sonik_id"
                      value={formData.sonik_id}
                      onChange={(e) => handleChange("sonik_id", e.target.value)}
                      placeholder="External system ID"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone_mobile">Mobile Phone *</Label>
                    <Input
                      id="phone_mobile"
                      type="tel"
                      value={formData.phone_mobile}
                      onChange={(e) => handleChange("phone_mobile", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone_alt">Alternative Phone</Label>
                    <Input
                      id="phone_alt"
                      type="tel"
                      value={formData.phone_alt}
                      onChange={(e) => handleChange("phone_alt", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="preferred_language">Preferred Language</Label>
                  <Select
                    value={formData.preferred_language}
                    onValueChange={(value) => handleChange("preferred_language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={formData.address_line1}
                    onChange={(e) => handleChange("address_line1", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={formData.address_line2}
                    onChange={(e) => handleChange("address_line2", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Region/State</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => handleChange("region", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => handleChange("postal_code", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="emergency" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => handleChange("emergency_contact_phone", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                    <Input
                      id="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => handleChange("emergency_contact_relationship", e.target.value)}
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
