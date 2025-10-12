import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ManageScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: any;
  onSuccess: () => void;
}

const daysOfWeek = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export function ManageScheduleDialog({ open, onOpenChange, schedule, onSuccess }: ManageScheduleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    provider_id: "",
    clinic_id: "",
    day_of_week: "monday" as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
    start_time: "09:00",
    end_time: "17:00",
    break_start: "12:00",
    break_end: "13:00",
    max_appointments: 8,
    effective_from: new Date().toISOString().split("T")[0],
    effective_until: "",
    notes: "",
  });

  useEffect(() => {
    loadProviders();
    loadClinics();
    if (schedule) {
      setFormData({
        provider_id: schedule.provider_id,
        clinic_id: schedule.clinic_id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        break_start: schedule.break_start || "12:00",
        break_end: schedule.break_end || "13:00",
        max_appointments: schedule.max_appointments || 8,
        effective_from: schedule.effective_from,
        effective_until: schedule.effective_until || "",
        notes: schedule.notes || "",
      });
    }
  }, [schedule]);

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

  const loadClinics = async () => {
    const { data, error } = await supabase
      .from("clinics")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    
    if (error) {
      toast({ variant: "destructive", title: "Error loading clinics", description: error.message });
    } else {
      setClinics(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      effective_until: formData.effective_until || null,
      break_start: formData.break_start || null,
      break_end: formData.break_end || null,
    };

    const { error } = schedule
      ? await supabase.from("provider_schedules").update(payload).eq("id", schedule.id)
      : await supabase.from("provider_schedules").insert([payload]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error saving schedule",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: schedule ? "Schedule updated successfully" : "Schedule created successfully",
      });
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{schedule ? "Edit Schedule" : "Create Schedule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="clinic_id">Clinic *</Label>
              <Select
                value={formData.clinic_id}
                onValueChange={(value) => setFormData({ ...formData, clinic_id: value })}
                required
              >
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day_of_week">Day of Week *</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(value: any) => setFormData({ ...formData, day_of_week: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_appointments">Max Appointments</Label>
              <Input
                id="max_appointments"
                type="number"
                min="1"
                value={formData.max_appointments}
                onChange={(e) => setFormData({ ...formData, max_appointments: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="break_start">Break Start</Label>
              <Input
                id="break_start"
                type="time"
                value={formData.break_start}
                onChange={(e) => setFormData({ ...formData, break_start: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="break_end">Break End</Label>
              <Input
                id="break_end"
                type="time"
                value={formData.break_end}
                onChange={(e) => setFormData({ ...formData, break_end: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effective_from">Effective From *</Label>
              <Input
                id="effective_from"
                type="date"
                value={formData.effective_from}
                onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective_until">Effective Until</Label>
              <Input
                id="effective_until"
                type="date"
                value={formData.effective_until}
                onChange={(e) => setFormData({ ...formData, effective_until: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : schedule ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}