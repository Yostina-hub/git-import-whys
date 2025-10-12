import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string | null;
  onSuccess: () => void;
}

export function AddMedicationDialog({ open, onOpenChange, patientId, onSuccess }: AddMedicationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [formData, setFormData] = useState({
    medication_name: "",
    dosage: "",
    route: "",
    frequency: "",
    status: "active",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !startDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in",
      });
      setLoading(false);
      return;
    }

    const medData: any = {
      patient_id: patientId,
      prescribed_by: user.id,
      medication_name: formData.medication_name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      start_date: format(startDate, "yyyy-MM-dd"),
      status: formData.status,
    };

    if (formData.route) medData.route = formData.route;
    if (endDate) medData.end_date = format(endDate, "yyyy-MM-dd");
    if (formData.notes) medData.notes = formData.notes;

    const { error } = await supabase.from("medications").insert(medData);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error adding medication",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Medication added successfully",
      });
      setFormData({
        medication_name: "",
        dosage: "",
        route: "",
        frequency: "",
        status: "active",
        notes: "",
      });
      setStartDate(undefined);
      setEndDate(undefined);
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Medication</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="medication_name">Medication Name *</Label>
            <Input
              id="medication_name"
              value={formData.medication_name}
              onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
              placeholder="e.g., Amoxicillin"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 500mg"
                required
              />
            </div>
            <div>
              <Label htmlFor="route">Route</Label>
              <Select
                value={formData.route}
                onValueChange={(value) => setFormData({ ...formData, route: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oral">Oral</SelectItem>
                  <SelectItem value="IV">IV (Intravenous)</SelectItem>
                  <SelectItem value="IM">IM (Intramuscular)</SelectItem>
                  <SelectItem value="SC">SC (Subcutaneous)</SelectItem>
                  <SelectItem value="topical">Topical</SelectItem>
                  <SelectItem value="inhalation">Inhalation</SelectItem>
                  <SelectItem value="rectal">Rectal</SelectItem>
                  <SelectItem value="ophthalmic">Ophthalmic</SelectItem>
                  <SelectItem value="otic">Otic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="frequency">Frequency *</Label>
            <Input
              id="frequency"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              placeholder="e.g., 3 times daily, BID, TID, QID"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Special instructions, warnings, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Medication"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
