import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CreateOrderDialogProps {
  patientId: string;
  appointmentId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ORDER_TYPES = [
  { value: "lab", label: "Lab Test" },
  { value: "imaging", label: "Imaging" },
  { value: "referral", label: "Referral" },
  { value: "prescription", label: "Prescription" },
];

const PRIORITY_LEVELS = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "stat", label: "STAT" },
];

export const CreateOrderDialog = ({
  patientId,
  appointmentId,
  open,
  onOpenChange,
  onSuccess,
}: CreateOrderDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState("lab");
  const [priority, setPriority] = useState("routine");
  const [notes, setNotes] = useState("");
  const [orderPayload, setOrderPayload] = useState<any>({});
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("orders" as any).insert({
        patient_id: patientId,
        appointment_id: appointmentId || null,
        order_type: orderType,
        priority: priority,
        notes: notes || null,
        ordered_by: user.id,
        order_payload: orderPayload,
        status: "draft",
      });

      if (error) throw error;

      toast({
        title: "Order created",
        description: "The order has been created successfully",
      });

      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating order",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOrderType("lab");
    setPriority("routine");
    setNotes("");
    setOrderPayload({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order-type">Order Type</Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {orderType === "lab" && (
            <div>
              <Label htmlFor="test-name">Test Name</Label>
              <Input
                id="test-name"
                value={orderPayload.testName || ""}
                onChange={(e) =>
                  setOrderPayload({ ...orderPayload, testName: e.target.value })
                }
                placeholder="e.g., Complete Blood Count"
                required
              />
            </div>
          )}

          {orderType === "imaging" && (
            <>
              <div>
                <Label htmlFor="imaging-type">Imaging Type</Label>
                <Select
                  value={orderPayload.imagingType || ""}
                  onValueChange={(value) =>
                    setOrderPayload({ ...orderPayload, imagingType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xray">X-Ray</SelectItem>
                    <SelectItem value="ct">CT Scan</SelectItem>
                    <SelectItem value="mri">MRI</SelectItem>
                    <SelectItem value="ultrasound">Ultrasound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="body-part">Body Part</Label>
                <Input
                  id="body-part"
                  value={orderPayload.bodyPart || ""}
                  onChange={(e) =>
                    setOrderPayload({ ...orderPayload, bodyPart: e.target.value })
                  }
                  placeholder="e.g., Chest"
                />
              </div>
            </>
          )}

          {orderType === "referral" && (
            <>
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  value={orderPayload.specialty || ""}
                  onChange={(e) =>
                    setOrderPayload({ ...orderPayload, specialty: e.target.value })
                  }
                  placeholder="e.g., Cardiology"
                  required
                />
              </div>
              <div>
                <Label htmlFor="provider-name">Provider Name (Optional)</Label>
                <Input
                  id="provider-name"
                  value={orderPayload.providerName || ""}
                  onChange={(e) =>
                    setOrderPayload({ ...orderPayload, providerName: e.target.value })
                  }
                  placeholder="Preferred provider"
                />
              </div>
            </>
          )}

          {orderType === "prescription" && (
            <>
              <div>
                <Label htmlFor="medication">Medication</Label>
                <Input
                  id="medication"
                  value={orderPayload.medication || ""}
                  onChange={(e) =>
                    setOrderPayload({ ...orderPayload, medication: e.target.value })
                  }
                  placeholder="e.g., Amoxicillin 500mg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={orderPayload.dosage || ""}
                    onChange={(e) =>
                      setOrderPayload({ ...orderPayload, dosage: e.target.value })
                    }
                    placeholder="e.g., 1 tablet"
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input
                    id="frequency"
                    value={orderPayload.frequency || ""}
                    onChange={(e) =>
                      setOrderPayload({ ...orderPayload, frequency: e.target.value })
                    }
                    placeholder="e.g., 3 times daily"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={orderPayload.duration || ""}
                  onChange={(e) =>
                    setOrderPayload({ ...orderPayload, duration: e.target.value })
                  }
                  placeholder="e.g., 7 days"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional instructions or clinical indications..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
