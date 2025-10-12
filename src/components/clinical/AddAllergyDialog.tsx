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

interface AddAllergyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string | null;
  onSuccess: () => void;
}

export function AddAllergyDialog({ open, onOpenChange, patientId, onSuccess }: AddAllergyDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [onsetDate, setOnsetDate] = useState<Date>();
  const [formData, setFormData] = useState({
    allergen: "",
    reaction: "",
    severity: "mild",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Patient ID is required",
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

    const allergyData: any = {
      patient_id: patientId,
      allergen: formData.allergen,
      reaction: formData.reaction,
      severity: formData.severity,
      verified_by: user.id,
    };

    if (onsetDate) allergyData.onset_date = format(onsetDate, "yyyy-MM-dd");
    if (formData.notes) allergyData.notes = formData.notes;

    const { error } = await supabase.from("allergies").insert(allergyData);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error adding allergy",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Allergy added successfully",
      });
      setFormData({
        allergen: "",
        reaction: "",
        severity: "mild",
        notes: "",
      });
      setOnsetDate(undefined);
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Allergy</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="allergen">Allergen *</Label>
            <Input
              id="allergen"
              value={formData.allergen}
              onChange={(e) => setFormData({ ...formData, allergen: e.target.value })}
              placeholder="e.g., Penicillin, Peanuts, Latex"
              required
            />
          </div>

          <div>
            <Label htmlFor="reaction">Reaction *</Label>
            <Input
              id="reaction"
              value={formData.reaction}
              onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
              placeholder="e.g., Rash, Hives, Anaphylaxis"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                  <SelectItem value="life_threatening">Life Threatening</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Onset Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !onsetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {onsetDate ? format(onsetDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={onsetDate}
                    onSelect={setOnsetDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details, triggers, precautions..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Allergy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
