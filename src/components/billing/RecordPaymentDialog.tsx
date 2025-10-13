import { useState } from "react";
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
import { DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const RecordPaymentDialog = ({ 
  invoice, 
  onPaymentRecorded 
}: { 
  invoice: any; 
  onPaymentRecorded: () => void 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    amount: invoice.balance_due || 0,
    method: "cash",
    transaction_ref: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: paymentError } = await supabase.from("payments").insert([{
        invoice_id: invoice.id,
        amount: Number(formData.amount),
        method: formData.method as any,
        transaction_ref: formData.transaction_ref || null,
        notes: formData.notes || null,
        received_by: user?.id,
      }]);

      if (paymentError) throw paymentError;

      // Check if invoice is now fully paid
      const { data: updatedInvoice } = await supabase
        .from("invoices")
        .select("status, balance_due, patient_id")
        .eq("id", invoice.id)
        .single();

      // If payment is complete, automatically add patient to triage queue
      if (updatedInvoice && (updatedInvoice.status === "paid" || updatedInvoice.balance_due <= 0)) {
        // Find triage queue
        const { data: triageQueue } = await supabase
          .from("queues")
          .select("id")
          .eq("queue_type", "triage")
          .eq("is_active", true)
          .single();

        if (triageQueue) {
          // Generate token number
          const { data: tokenData } = await supabase.rpc("generate_ticket_token", {
            queue_prefix: "Q"
          });
          const tokenNumber = tokenData || `Q${Date.now()}`;

          // Add to triage queue
          await supabase.from("tickets").insert([{
            queue_id: triageQueue.id,
            patient_id: updatedInvoice.patient_id,
            token_number: tokenNumber,
            status: "waiting",
            priority: "routine",
            notes: "Auto-added after payment completion",
          }]);

          // Update patient registration status to completed
          await supabase
            .from("patients")
            .update({ registration_status: "completed" })
            .eq("id", updatedInvoice.patient_id);

          toast({
            title: "Payment recorded & transferred to triage",
            description: `Patient automatically added to triage queue with token ${tokenNumber}`,
          });
        } else {
          toast({
            title: "Payment recorded",
            description: "Payment has been recorded successfully",
          });
        }
      } else {
        toast({
          title: "Payment recorded",
          description: "Payment has been recorded successfully",
        });
      }

      setOpen(false);
      setFormData({
        amount: 0,
        method: "cash",
        transaction_ref: "",
        notes: "",
      });
      onPaymentRecorded();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error recording payment",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <DollarSign className="h-4 w-4 mr-1" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={invoice.balance_due}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Balance due: ${Number(invoice.balance_due).toFixed(2)}
            </p>
          </div>

          <div>
            <Label htmlFor="method">Payment Method</Label>
            <Select
              value={formData.method}
              onValueChange={(value) => setFormData({ ...formData, method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="telebirr">TeleBirr</SelectItem>
                <SelectItem value="cbe_birr">CBE Birr</SelectItem>
                <SelectItem value="mobile">Other Mobile Payment</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="transaction_ref">Transaction Reference (Optional)</Label>
            <Input
              id="transaction_ref"
              value={formData.transaction_ref}
              onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })}
              placeholder="Check #, transaction ID, etc."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional payment notes"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
