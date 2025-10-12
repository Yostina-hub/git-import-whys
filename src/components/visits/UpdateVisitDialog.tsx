import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface UpdateVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: any;
  onSuccess: () => void;
}

export function UpdateVisitDialog({ open, onOpenChange, visit, onSuccess }: UpdateVisitDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    state: "",
    primary_provider_id: "",
  });

  useEffect(() => {
    if (open && visit) {
      loadProviders();
      setFormData({
        state: visit.state || "",
        primary_provider_id: visit.primary_provider_id || "",
      });
    }
  }, [open, visit]);

  const loadProviders = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("status", "active")
      .order("first_name");
    setProviders(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updateData: any = {
      state: formData.state,
    };

    if (formData.primary_provider_id) {
      updateData.primary_provider_id = formData.primary_provider_id;
    }

    // If discharging, set closed_at
    if (formData.state === "discharged" && !visit.closed_at) {
      updateData.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("visits")
      .update(updateData)
      .eq("id", visit.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating visit",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Visit updated successfully",
      });
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Visit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="state">Visit State *</Label>
            <Select
              value={formData.state}
              onValueChange={(value) => setFormData({ ...formData, state: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="payment_pending">Payment Pending</SelectItem>
                <SelectItem value="payment_confirmed">Payment Confirmed</SelectItem>
                <SelectItem value="in_care">In Care</SelectItem>
                <SelectItem value="discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="provider">Primary Provider</Label>
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
              {loading ? "Updating..." : "Update Visit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
