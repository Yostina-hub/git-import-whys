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
import { Package, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CreatePackageInvoiceDialogProps {
  patientId?: string;
  onInvoiceCreated: () => void;
}

export const CreatePackageInvoiceDialog = ({
  patientId,
  onInvoiceCreated,
}: CreatePackageInvoiceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [patients, setPatients] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState(patientId || "");
  const [selectedPackages, setSelectedPackages] = useState<{ packageId: string; quantity: number }[]>([]);

  useEffect(() => {
    if (open) {
      loadPatients();
      loadPackages();
    }
  }, [open]);

  const loadPatients = async () => {
    const { data } = await supabase
      .from("patients")
      .select("id, first_name, last_name, mrn")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setPatients(data);
  };

  const loadPackages = async () => {
    const { data } = await supabase
      .from("packages")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) setPackages(data);
  };

  const addPackage = (packageId: string) => {
    if (selectedPackages.some(p => p.packageId === packageId)) {
      toast({
        variant: "destructive",
        title: "Package already added",
        description: "This package is already in the invoice",
      });
      return;
    }

    setSelectedPackages([...selectedPackages, { packageId, quantity: 1 }]);
  };

  const removePackage = (packageId: string) => {
    setSelectedPackages(selectedPackages.filter(p => p.packageId !== packageId));
  };

  const updateQuantity = (packageId: string, quantity: number) => {
    setSelectedPackages(selectedPackages.map(p =>
      p.packageId === packageId ? { ...p, quantity } : p
    ));
  };

  const calculateTotal = () => {
    let subtotal = 0;
    selectedPackages.forEach(({ packageId, quantity }) => {
      const pkg = packages.find(p => p.id === packageId);
      if (pkg) {
        subtotal += Number(pkg.bundle_price) * quantity;
      }
    });

    const taxRate = 15; // Default tax rate
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast({
        variant: "destructive",
        title: "Patient required",
        description: "Please select a patient",
      });
      return;
    }

    if (selectedPackages.length === 0) {
      toast({
        variant: "destructive",
        title: "No packages selected",
        description: "Please add at least one package",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Build invoice lines
      const lines = selectedPackages.map(({ packageId, quantity }) => {
        const pkg = packages.find(p => p.id === packageId);
        return {
          description: `${pkg.name} Package`,
          quantity,
          unit_price: pkg.bundle_price,
          package_id: packageId,
          package_components: pkg.components,
        };
      });

      const { subtotal, taxAmount, total } = calculateTotal();

      const { error } = await supabase
        .from("invoices")
        .insert([
          {
            patient_id: selectedPatient,
            status: "issued",
            lines: lines,
            subtotal,
            tax_amount: taxAmount,
            total_amount: total,
            balance_due: total,
            created_by: user?.id,
            issued_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      toast({
        title: "Package invoice created",
        description: "Invoice has been created successfully",
      });

      setOpen(false);
      setSelectedPackages([]);
      setSelectedPatient("");
      onInvoiceCreated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating invoice",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Package className="h-4 w-4 mr-2" />
          Package Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Package Invoice</DialogTitle>
          <DialogDescription>
            Create an invoice from treatment packages
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patient">Patient</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger id="patient">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.mrn} - {patient.first_name} {patient.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="add-package">Add Package</Label>
            <Select onValueChange={addPackage} value="">
              <SelectTrigger id="add-package">
                <SelectValue placeholder="Select package to add" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name} - ${Number(pkg.bundle_price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPackages.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              <Label>Selected Packages</Label>
              {selectedPackages.map(({ packageId, quantity }) => {
                const pkg = packages.find(p => p.id === packageId);
                if (!pkg) return null;

                return (
                  <div key={packageId} className="flex items-center gap-4 p-3 bg-muted rounded-md">
                    <div className="flex-1">
                      <div className="font-medium">{pkg.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${Number(pkg.bundle_price).toFixed(2)} per package
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {pkg.components?.map((comp: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {comp.service_name || comp.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`qty-${packageId}`} className="text-sm">Qty:</Label>
                      <Input
                        id={`qty-${packageId}`}
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => updateQuantity(packageId, Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    <div className="font-semibold">
                      ${(Number(pkg.bundle_price) * quantity).toFixed(2)}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removePackage(packageId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-muted p-4 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (15%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
