import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RequestTimeOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RequestTimeOffDialog({ open, onOpenChange, onSuccess }: RequestTimeOffDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    provider_id: "",
    exception_date: new Date().toISOString().split("T")[0],
    start_time: "",
    end_time: "",
    reason: "",
    exception_type: "leave" as "leave" | "override",
  });

  useEffect(() => {
    loadCurrentUser();
    loadProviders();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      setFormData(prev => ({ ...prev, provider_id: user.id }));
    }
  };

  const loadProviders = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .order("first_name");
    
    if (error) {
      toast({ variant: "destructive", title: "Error loading providers", description: error.message });
    } else {
      setProviders(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      provider_id: formData.provider_id,
      exception_date: formData.exception_date,
      exception_type: formData.exception_type,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      reason: formData.reason,
      status: "pending",
    };

    const { error } = await supabase.from("schedule_exceptions").insert([payload]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating time-off request",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Time-off request submitted for approval",
      });
      onSuccess();
      onOpenChange(false);
      setFormData({
        provider_id: currentUser?.id || "",
        exception_date: new Date().toISOString().split("T")[0],
        start_time: "",
        end_time: "",
        reason: "",
        exception_type: "leave",
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider_id">Provider *</Label>
            <Select
              value={formData.provider_id}
              onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
              required
            >
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
            <Label htmlFor="exception_date">Date *</Label>
            <Input
              id="exception_date"
              type="date"
              value={formData.exception_date}
              onChange={(e) => setFormData({ ...formData, exception_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exception_type">Type *</Label>
            <Select
              value={formData.exception_type}
              onValueChange={(value: any) => setFormData({ ...formData, exception_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leave">Full Day Leave</SelectItem>
                <SelectItem value="override">Partial Leave / Override</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.exception_type === "override" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}