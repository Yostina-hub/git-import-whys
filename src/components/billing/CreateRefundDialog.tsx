import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface CreateRefundDialogProps {
  onRefundCreated: () => void;
}

export function CreateRefundDialog({ onRefundCreated }: CreateRefundDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [formData, setFormData] = useState({
    amount: "",
    reason: "",
  });

  useEffect(() => {
    if (open) {
      loadPayments();
    }
  }, [open]);

  const loadPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        invoice:invoices(
          id,
          patient:patients(first_name, last_name, mrn)
        )
      `)
      .order("received_at", { ascending: false })
      .limit(50);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading payments",
        description: error.message,
      });
    } else {
      setPayments(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPayment) {
      toast({
        variant: "destructive",
        title: "Payment Required",
        description: "Please select a payment to refund",
      });
      return;
    }

    const payment = payments.find((p) => p.id === selectedPayment);
    const amount = parseFloat(formData.amount);

    if (amount <= 0 || amount > payment.amount) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: `Refund amount must be between $0.01 and $${payment.amount}`,
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("refunds").insert({
      payment_id: selectedPayment,
      amount: amount,
      reason: formData.reason,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating refund",
        description: error.message,
      });
    } else {
      toast({
        title: "Refund Created",
        description: "The refund request has been created successfully",
      });
      setFormData({ amount: "", reason: "" });
      setSelectedPayment("");
      onRefundCreated();
      setOpen(false);
    }
    setLoading(false);
  };

  const selectedPaymentData = payments.find((p) => p.id === selectedPayment);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Refund</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="payment">Select Payment *</Label>
            <Select value={selectedPayment} onValueChange={setSelectedPayment}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a payment to refund..." />
              </SelectTrigger>
              <SelectContent>
                {payments.map((payment) => (
                  <SelectItem key={payment.id} value={payment.id}>
                    {payment.invoice?.patient
                      ? `${payment.invoice.patient.mrn} - ${payment.invoice.patient.first_name} ${payment.invoice.patient.last_name}`
                      : "Unknown"}{" "}
                    - ${Number(payment.amount).toFixed(2)} ({payment.method}) -{" "}
                    {new Date(payment.received_at).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPaymentData && (
              <p className="text-sm text-muted-foreground mt-1">
                Payment Amount: ${Number(selectedPaymentData.amount).toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Refund Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={selectedPaymentData?.amount || 0}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason for Refund *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Explain why this refund is being requested..."
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Refund"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
