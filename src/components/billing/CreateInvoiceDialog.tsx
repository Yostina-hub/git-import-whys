import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CreateInvoiceDialog = ({ onInvoiceCreated }: { onInvoiceCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [lines, setLines] = useState<any[]>([
    { service_id: "", description: "", quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    if (open) {
      loadPatients();
      loadServices();
    }
  }, [open]);

  const loadPatients = async () => {
    const { data } = await supabase
      .from("patients")
      .select("id, mrn, first_name, last_name")
      .order("created_at", { ascending: false })
      .limit(100);
    setPatients(data || []);
  };

  const loadServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true);
    setServices(data || []);
  };

  const addLine = () => {
    setLines([...lines, { service_id: "", description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...lines];
    updated[index][field] = value;

    if (field === "service_id" && value) {
      const service = services.find((s) => s.id === value);
      if (service) {
        updated[index].description = service.name;
        updated[index].unit_price = service.unit_price;
      }
    }

    setLines(updated);
  };

  const calculateTotals = () => {
    const subtotal = lines.reduce(
      (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_price) || 0),
      0
    );
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast({
        variant: "destructive",
        title: "Missing patient",
        description: "Please select a patient",
      });
      return;
    }

    setLoading(true);

    const { subtotal, tax, total } = calculateTotals();

    const { error } = await supabase.from("invoices").insert({
      patient_id: selectedPatient,
      lines: lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price),
        total: Number(l.quantity) * Number(l.unit_price),
      })),
      subtotal,
      tax_amount: tax,
      total_amount: total,
      balance_due: total,
      status: "issued",
      issued_at: new Date().toISOString(),
    });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating invoice",
        description: error.message,
      });
    } else {
      toast({
        title: "Invoice created",
        description: "Invoice has been created successfully",
      });
      setOpen(false);
      setSelectedPatient("");
      setLines([{ service_id: "", description: "", quantity: 1, unit_price: 0 }]);
      onInvoiceCreated();
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patient">Patient</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
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
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" />
                Add Line
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded">
                  <div className="col-span-4">
                    <Label className="text-xs">Service</Label>
                    <Select
                      value={line.service_id}
                      onValueChange={(v) => updateLine(index, "service_id", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Label className="text-xs">Description</Label>
                    <Input
                      className="h-9"
                      value={line.description}
                      onChange={(e) => updateLine(index, "description", e.target.value)}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      className="h-9"
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, "quantity", e.target.value)}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Price</Label>
                    <Input
                      className="h-9"
                      type="number"
                      step="0.01"
                      value={line.unit_price}
                      onChange={(e) => updateLine(index, "unit_price", e.target.value)}
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(index)}
                      disabled={lines.length === 1}
                      className="h-9 w-9 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-end space-y-1 text-sm">
              <div className="w-64 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              Create Invoice
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
