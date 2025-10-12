import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface UpdateOrderStatusDialogProps {
  order: {
    id: string;
    status: string;
    order_type: string;
    linked_invoice_id: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ORDER_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const UpdateOrderStatusDialog = ({
  order,
  open,
  onOpenChange,
  onSuccess,
}: UpdateOrderStatusDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(order?.status || "draft");
  const [results, setResults] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    // Billing gate enforcement: prevent completion without billing
    if (status === "completed" && !order.linked_invoice_id) {
      toast({
        variant: "destructive",
        title: "Billing Required",
        description: "Cannot complete order without creating an invoice first. Please create an invoice before marking as completed.",
      });
      return;
    }

    setLoading(true);

    try {
      const updateData: any = { status };

      if (status === "completed" && results) {
        updateData.result_payload = { results };
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders" as any)
        .update(updateData)
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Order updated",
        description: "The order status has been updated successfully",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating order",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!order?.linked_invoice_id && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This order has not been billed yet. Create an invoice before completing the order.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((statusOption) => (
                  <SelectItem key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === "completed" && (
            <div>
              <Label htmlFor="results">Results / Findings</Label>
              <Textarea
                id="results"
                value={results}
                onChange={(e) => setResults(e.target.value)}
                placeholder="Enter test results, findings, or outcome..."
                rows={5}
                required
              />
            </div>
          )}

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
              {loading ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
