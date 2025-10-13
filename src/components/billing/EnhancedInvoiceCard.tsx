import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Calendar, User, FileText, CreditCard } from "lucide-react";
import { RecordPaymentDialog } from "./RecordPaymentDialog";

interface EnhancedInvoiceCardProps {
  invoice: any;
  onPaymentRecorded: () => void;
}

export const EnhancedInvoiceCard = ({
  invoice,
  onPaymentRecorded,
}: EnhancedInvoiceCardProps) => {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; label: string }> = {
      draft: { color: "text-gray-700 dark:text-gray-300", bg: "bg-gray-100 dark:bg-gray-800", label: "Draft" },
      issued: { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30", label: "Issued" },
      paid: { color: "text-green-700 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900/30", label: "Paid" },
      partial: { color: "text-yellow-700 dark:text-yellow-300", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Partial" },
      refunded: { color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-900/30", label: "Refunded" },
      void: { color: "text-red-700 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900/30", label: "Void" },
    };
    return configs[status] || configs.draft;
  };

  const lines = Array.isArray(invoice.lines) ? invoice.lines : [];
  const description = lines.length > 0 ? lines[0].description || "Invoice" : "Invoice";
  const statusConfig = getStatusConfig(invoice.status);
  const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.balance_due > 0;

  return (
    <Card className={`group relative overflow-hidden border-l-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
      isOverdue ? 'border-l-destructive' : 'border-l-primary'
    }`}>
      {isOverdue && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-destructive text-destructive-foreground border-0">
            Overdue
          </Badge>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold text-primary">
                  #{invoice.id.slice(0, 8)}
                </span>
              </div>
              {invoice.patients && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm">
                    {invoice.patients.mrn} - {invoice.patients.first_name} {invoice.patients.last_name}
                  </span>
                </div>
              )}
            </div>
            <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0 px-3 py-1`}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Invoice Details */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{description}</p>
            
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-semibold text-lg">
                    ${Number(invoice.total_amount || 0).toFixed(2)}
                  </span>
                </div>
                {invoice.balance_due > 0 && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-muted-foreground">Balance Due:</span>
                    <span className="font-semibold text-destructive">
                      ${Number(invoice.balance_due || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {invoice.issued_at 
                  ? new Date(invoice.issued_at).toLocaleDateString()
                  : new Date(invoice.created_at).toLocaleDateString()
                }
              </div>
            </div>
          </div>

          {/* Actions */}
          {invoice.balance_due > 0 && invoice.status !== 'void' && (
            <div className="pt-2 border-t">
              <RecordPaymentDialog 
                invoice={invoice} 
                onPaymentRecorded={onPaymentRecorded} 
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
