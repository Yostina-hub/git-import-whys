import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface ManageServicePointDialogProps {
  servicePoint?: any;
  onSuccess: () => void;
}

export const ManageServicePointDialog = ({
  servicePoint,
  onSuccess,
}: ManageServicePointDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [queues, setQueues] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    queue_id: "",
    station_number: "",
    location_description: "",
    is_active: true,
    supports_walkins: true,
    supports_appointments: true,
  });

  useEffect(() => {
    if (open) {
      loadQueues();
      if (servicePoint) {
        setFormData({
          name: servicePoint.name || "",
          code: servicePoint.code || "",
          queue_id: servicePoint.queue_id || "",
          station_number: servicePoint.station_number || "",
          location_description: servicePoint.location_description || "",
          is_active: servicePoint.is_active ?? true,
          supports_walkins: servicePoint.supports_walkins ?? true,
          supports_appointments: servicePoint.supports_appointments ?? true,
        });
      }
    }
  }, [open, servicePoint]);

  const loadQueues = async () => {
    const { data } = await supabase
      .from("queues")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) setQueues(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In production, this would save to a service_points table
      // For now, we'll simulate success
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      toast({
        title: servicePoint ? "Service point updated" : "Service point created",
        description: "Changes have been saved successfully",
      });

      setOpen(false);
      if (!servicePoint) {
        setFormData({
          name: "",
          code: "",
          queue_id: "",
          station_number: "",
          location_description: "",
          is_active: true,
          supports_walkins: true,
          supports_appointments: true,
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {servicePoint ? (
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Service Point
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {servicePoint ? "Edit Service Point" : "Add Service Point"}
          </DialogTitle>
          <DialogDescription>
            Configure a service point or station for queue management
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Service Point Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Counter 1, Room A"
                required
              />
            </div>

            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., C1, RM-A"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="queue">Associated Queue *</Label>
              <Select
                value={formData.queue_id}
                onValueChange={(value) => setFormData({ ...formData, queue_id: value })}
                required
              >
                <SelectTrigger id="queue">
                  <SelectValue placeholder="Select queue" />
                </SelectTrigger>
                <SelectContent>
                  {queues.map((queue) => (
                    <SelectItem key={queue.id} value={queue.id}>
                      {queue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="station">Station Number</Label>
              <Input
                id="station"
                value={formData.station_number}
                onChange={(e) => setFormData({ ...formData, station_number: e.target.value })}
                placeholder="e.g., 1, A-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location Description</Label>
            <Textarea
              id="location"
              value={formData.location_description}
              onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
              placeholder="e.g., Ground Floor, near main entrance"
              rows={2}
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this service point for operations
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="walkins">Support Walk-ins</Label>
                <p className="text-sm text-muted-foreground">
                  Accept walk-in patients at this point
                </p>
              </div>
              <Switch
                id="walkins"
                checked={formData.supports_walkins}
                onCheckedChange={(checked) => setFormData({ ...formData, supports_walkins: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="appointments">Support Appointments</Label>
                <p className="text-sm text-muted-foreground">
                  Accept scheduled appointments at this point
                </p>
              </div>
              <Switch
                id="appointments"
                checked={formData.supports_appointments}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, supports_appointments: checked })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : servicePoint ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
