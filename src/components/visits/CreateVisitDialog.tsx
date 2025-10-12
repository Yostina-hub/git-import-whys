import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CreateVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateVisitDialog({ open, onOpenChange, onSuccess }: CreateVisitDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    patient_id: "",
    visit_type: "walk_in",
    primary_provider_id: "",
  });

  useEffect(() => {
    if (open) {
      loadPatients();
      loadProviders();
    }
  }, [open]);

  const loadPatients = async () => {
    const { data } = await supabase
      .from("patients")
      .select("id, mrn, first_name, last_name")
      .order("created_at", { ascending: false })
      .limit(100);
    setPatients(data || []);
  };

  const loadProviders = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .order("first_name");
    setProviders(data || []);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a patient",
      });
      return;
    }

    setLoading(true);

    const visitData: any = {
      patient_id: formData.patient_id,
      visit_type: formData.visit_type,
      state: "initiated",
      opened_at: new Date().toISOString(),
    };

    if (formData.primary_provider_id) {
      visitData.primary_provider_id = formData.primary_provider_id;
    }

    const { error } = await supabase.from("visits").insert(visitData);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating visit",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Visit created successfully",
      });
      setFormData({
        patient_id: "",
        visit_type: "walk_in",
        primary_provider_id: "",
      });
      setSearchTerm("");
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Visit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patient">Patient *</Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by MRN or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={formData.patient_id}
                onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPatients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.mrn} - {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="visit_type">Visit Type *</Label>
            <Select
              value={formData.visit_type}
              onValueChange={(value) => setFormData({ ...formData, visit_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk_in">Walk-in</SelectItem>
                <SelectItem value="appointment">Scheduled Appointment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="provider">Primary Provider (Optional)</Label>
            <Select
              value={formData.primary_provider_id}
              onValueChange={(value) => setFormData({ ...formData, primary_provider_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.first_name} {provider.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Visit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
