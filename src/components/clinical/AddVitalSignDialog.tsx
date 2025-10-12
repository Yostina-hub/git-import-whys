import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddVitalSignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string | null;
  onSuccess: () => void;
}

export function AddVitalSignDialog({ open, onOpenChange, patientId, onSuccess }: AddVitalSignDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    temperature: "",
    temperature_unit: "celsius",
    oxygen_saturation: "",
    respiratory_rate: "",
    height: "",
    height_unit: "cm",
    weight: "",
    weight_unit: "kg",
    notes: "",
  });

  const calculateBMI = () => {
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);
    
    if (!height || !weight) return null;

    // Convert to metric if needed
    const heightInMeters = formData.height_unit === 'cm' ? height / 100 : height * 0.0254;
    const weightInKg = formData.weight_unit === 'kg' ? weight : weight * 0.453592;

    return (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to record vitals",
      });
      setLoading(false);
      return;
    }

    const bmi = calculateBMI();

    const vitalData: any = {
      patient_id: patientId,
      recorded_by: user.id,
      temperature_unit: formData.temperature_unit,
      height_unit: formData.height_unit,
      weight_unit: formData.weight_unit,
      notes: formData.notes || null,
    };

    // Only include non-empty numeric values
    if (formData.blood_pressure_systolic) vitalData.blood_pressure_systolic = parseInt(formData.blood_pressure_systolic);
    if (formData.blood_pressure_diastolic) vitalData.blood_pressure_diastolic = parseInt(formData.blood_pressure_diastolic);
    if (formData.heart_rate) vitalData.heart_rate = parseInt(formData.heart_rate);
    if (formData.temperature) vitalData.temperature = parseFloat(formData.temperature);
    if (formData.oxygen_saturation) vitalData.oxygen_saturation = parseInt(formData.oxygen_saturation);
    if (formData.respiratory_rate) vitalData.respiratory_rate = parseInt(formData.respiratory_rate);
    if (formData.height) vitalData.height = parseFloat(formData.height);
    if (formData.weight) vitalData.weight = parseFloat(formData.weight);
    if (bmi) vitalData.bmi = parseFloat(bmi);

    const { error } = await supabase.from("vital_signs").insert(vitalData);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error recording vitals",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Vital signs recorded successfully",
      });
      setFormData({
        blood_pressure_systolic: "",
        blood_pressure_diastolic: "",
        heart_rate: "",
        temperature: "",
        temperature_unit: "celsius",
        oxygen_saturation: "",
        respiratory_rate: "",
        height: "",
        height_unit: "cm",
        weight: "",
        weight_unit: "kg",
        notes: "",
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
          <DialogTitle>Record Vital Signs</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Blood Pressure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bp_systolic">BP Systolic (mmHg)</Label>
              <Input
                id="bp_systolic"
                type="number"
                min="60"
                max="250"
                value={formData.blood_pressure_systolic}
                onChange={(e) => setFormData({ ...formData, blood_pressure_systolic: e.target.value })}
                placeholder="120"
              />
            </div>
            <div>
              <Label htmlFor="bp_diastolic">BP Diastolic (mmHg)</Label>
              <Input
                id="bp_diastolic"
                type="number"
                min="40"
                max="150"
                value={formData.blood_pressure_diastolic}
                onChange={(e) => setFormData({ ...formData, blood_pressure_diastolic: e.target.value })}
                placeholder="80"
              />
            </div>
          </div>

          {/* Heart Rate & Respiratory Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
              <Input
                id="heart_rate"
                type="number"
                min="30"
                max="250"
                value={formData.heart_rate}
                onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                placeholder="72"
              />
            </div>
            <div>
              <Label htmlFor="respiratory_rate">Respiratory Rate (/min)</Label>
              <Input
                id="respiratory_rate"
                type="number"
                min="8"
                max="60"
                value={formData.respiratory_rate}
                onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
                placeholder="16"
              />
            </div>
          </div>

          {/* Temperature */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                placeholder="37.0"
              />
            </div>
            <div>
              <Label htmlFor="temp_unit">Unit</Label>
              <Select
                value={formData.temperature_unit}
                onValueChange={(value) => setFormData({ ...formData, temperature_unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celsius">°C</SelectItem>
                  <SelectItem value="fahrenheit">°F</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Oxygen Saturation */}
          <div>
            <Label htmlFor="oxygen_saturation">Oxygen Saturation (%)</Label>
            <Input
              id="oxygen_saturation"
              type="number"
              min="70"
              max="100"
              value={formData.oxygen_saturation}
              onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value })}
              placeholder="98"
            />
          </div>

          {/* Height & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  className="col-span-2"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="170"
                />
                <Select
                  value={formData.height_unit}
                  onValueChange={(value) => setFormData({ ...formData, height_unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  className="col-span-2"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="70"
                />
                <Select
                  value={formData.weight_unit}
                  onValueChange={(value) => setFormData({ ...formData, weight_unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* BMI Display */}
          {formData.height && formData.weight && (
            <div className="p-3 bg-muted rounded-md">
              <Label>Calculated BMI</Label>
              <div className="text-2xl font-bold">{calculateBMI()}</div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional observations..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Vitals"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
