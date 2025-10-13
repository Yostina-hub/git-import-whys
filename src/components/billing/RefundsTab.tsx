import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Check, X } from "lucide-react";
import { CreateRefundDialog } from "./CreateRefundDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function RefundsTab() {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("refunds")
      .select(`
        *,
        payment:payments(
          id,
          amount,
          method,
          invoice:invoices(
            id,
            patient:patients(first_name, last_name, mrn)
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading refunds",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    // Fetch approver details separately for each refund
    const refundsWithApprovers = await Promise.all(
      (data || []).map(async (refund) => {
        if (refund.approved_by) {
          const { data: approver } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", refund.approved_by)
            .single();
          
          return {
            ...refund,
            approved_by: approver
          };
        }
        return refund;
      })
    );

    setRefunds(refundsWithApprovers);
    setLoading(false);
  };

  const handleProcessRefund = async (refundId: string) => {
    setProcessingId(refundId);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in",
      });
      setProcessingId(null);
      return;
    }

    const { error } = await supabase
      .from("refunds")
      .update({
        processed_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq("id", refundId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error processing refund",
        description: error.message,
      });
    } else {
      toast({
        title: "Refund Processed",
        description: "The refund has been successfully processed",
      });
      loadRefunds();
    }
    setProcessingId(null);
  };

  const getStatusBadge = (refund: any) => {
    if (refund.processed_at) {
      return <Badge className="bg-green-500">Processed</Badge>;
    }
    return <Badge className="bg-yellow-500">Pending</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Refunds</CardTitle>
          <CreateRefundDialog onRefundCreated={loadRefunds} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : refunds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No refunds recorded yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Refund ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell className="font-mono text-sm">
                    {refund.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {refund.payment?.invoice?.patient ? (
                      <>
                        {refund.payment.invoice.patient.mrn} -{" "}
                        {refund.payment.invoice.patient.first_name}{" "}
                        {refund.payment.invoice.patient.last_name}
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${Number(refund.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {refund.reason}
                  </TableCell>
                  <TableCell>
                    {new Date(refund.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(refund)}</TableCell>
                  <TableCell>
                    {refund.approved_by ? (
                      <>
                        {refund.approved_by.first_name} {refund.approved_by.last_name}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!refund.processed_at && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            disabled={processingId === refund.id}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Process Refund</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to approve this refund of $
                              {Number(refund.amount).toFixed(2)}? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleProcessRefund(refund.id)}
                            >
                              Approve Refund
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
