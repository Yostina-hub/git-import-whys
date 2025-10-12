import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreateInvoiceFromOrderDialogProps {
  order: {
    id: string;
    patient_id: string;
    order_type: string;
    order_payload: any;
    linked_invoice_id: string | null;
  };
  onInvoiceCreated: () => void;
}

export const CreateInvoiceFromOrderDialog = ({
  order,
  onInvoiceCreated,
}: CreateInvoiceFromOrderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    description: `${order.order_type.toUpperCase()} - ${getOrderDescription(order)}`,
    unitPrice: 0,
    quantity: 1,
    taxRate: 15,
  });

  function getOrderDescription(order: any) {
    switch (order.order_type) {
      case "lab":
        return order.order_payload?.testName || "Lab Test";
      case "imaging":
        return `${order.order_payload?.imagingType || "Imaging"} - ${order.order_payload?.bodyPart || ""}`;
      case "referral":
        return `Referral to ${order.order_payload?.specialty || "Specialist"}`;
      case "prescription":
        return order.order_payload?.medication || "Prescription";
      default:
        return "Medical Service";
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const subtotal = Number(formData.unitPrice) * Number(formData.quantity);
      const taxAmount = (subtotal * Number(formData.taxRate)) / 100;
      const totalAmount = subtotal + taxAmount;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([
          {
            patient_id: order.patient_id,
            status: "issued",
            lines: [
              {
                description: formData.description,
                quantity: formData.quantity,
                unit_price: formData.unitPrice,
              },
            ],
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            balance_due: totalAmount,
            created_by: user?.id,
            issued_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Link invoice to order
      const { error: updateError } = await supabase
        .from("orders" as any)
        .update({ linked_invoice_id: invoice.id })
        .eq("id", order.id);

      if (updateError) throw updateError;

      toast({
        title: "Invoice created",
        description: `Invoice created and linked to order successfully`,
      });

      setOpen(false);
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

  if (order.linked_invoice_id) {
    return (
      <Badge variant="outline" className="gap-1">
        <DollarSign className="h-3 w-3" />
        Billed
      </Badge>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-4 w-4 mr-1" />
          Create Invoice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Invoice from Order</DialogTitle>
          <DialogDescription>
            Generate an invoice for this {order.order_type} order
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Service Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="unitPrice">Unit Price ($)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: Number(e.target.value) })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxRate}
              onChange={(e) =>
                setFormData({ ...formData, taxRate: Number(e.target.value) })
              }
              required
            />
          </div>

          <div className="bg-muted p-4 rounded-md space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${(formData.unitPrice * formData.quantity).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({formData.taxRate}%):</span>
              <span>
                ${((formData.unitPrice * formData.quantity * formData.taxRate) / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total:</span>
              <span>
                ${(
                  formData.unitPrice * formData.quantity +
                  (formData.unitPrice * formData.quantity * formData.taxRate) / 100
                ).toFixed(2)}
              </span>
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
