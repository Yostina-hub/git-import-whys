import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface EditPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: any;
  onSuccess: () => void;
}

export function EditPackageDialog({ open, onOpenChange, package: pkg, onSuccess }: EditPackageDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [components, setComponents] = useState<Array<{ service_id: string; qty: number }>>([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    bundle_price: "",
    validity_days: "",
    description: "",
  });

  useEffect(() => {
    if (open && pkg) {
      loadServices();
      setFormData({
        code: pkg.code || "",
        name: pkg.name || "",
        bundle_price: pkg.bundle_price?.toString() || "",
        validity_days: pkg.validity_days?.toString() || "",
        description: pkg.description || "",
      });
      setComponents(Array.isArray(pkg.components) ? pkg.components : []);
    }
  }, [open, pkg]);

  const loadServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("name");
    setServices(data || []);
  };

  const addComponent = () => {
    if (services.length > 0) {
      setComponents([...components, { service_id: services[0].id, qty: 1 }]);
    }
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: string, value: any) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (components.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one service to the package",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("packages")
      .update({
        code: formData.code,
        name: formData.name,
        bundle_price: parseFloat(formData.bundle_price),
        validity_days: formData.validity_days ? parseInt(formData.validity_days) : null,
        description: formData.description || null,
        components: components,
      })
      .eq("id", pkg.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating package",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Package updated successfully",
      });
      onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Package</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Package Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="validity_days">Validity (Days)</Label>
              <Input
                id="validity_days"
                type="number"
                min="1"
                value={formData.validity_days}
                onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })}
                placeholder="Leave blank for unlimited"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name">Package Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="bundle_price">Bundle Price ($) *</Label>
            <Input
              id="bundle_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.bundle_price}
              onChange={(e) => setFormData({ ...formData, bundle_price: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base">Package Components *</Label>
              <Button type="button" size="sm" onClick={addComponent} disabled={services.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>

            {components.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No services added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {components.map((component, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Service</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={component.service_id}
                        onChange={(e) => updateComponent(index, 'service_id', e.target.value)}
                      >
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} (${Number(service.unit_price).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={component.qty}
                        onChange={(e) => updateComponent(index, 'qty', parseInt(e.target.value))}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeComponent(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Package"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
