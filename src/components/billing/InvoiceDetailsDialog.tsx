import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  FileText, 
  Calendar, 
  DollarSign, 
  CreditCard,
  Printer,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { InvoicePrintView } from "./InvoicePrintView";
import { InvoicePOSPrint } from "./InvoicePOSPrint";

interface InvoiceDetailsDialogProps {
  invoice: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InvoiceDetailsDialog = ({ invoice, open, onOpenChange }: InvoiceDetailsDialogProps) => {
  const [showRegularPrint, setShowRegularPrint] = useState(false);
  const [showPOSPrint, setShowPOSPrint] = useState(false);

  const lines = Array.isArray(invoice.lines) ? invoice.lines : [];
  const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.balance_due > 0;

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: any; className: string }> = {
      draft: { variant: "outline", className: "bg-muted text-muted-foreground" },
      issued: { variant: "default", className: "bg-blue-600" },
      paid: { variant: "default", className: "bg-success" },
      partial: { variant: "secondary", className: "bg-warning" },
      refunded: { variant: "outline", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
      void: { variant: "destructive", className: "" },
    };
    return configs[status] || configs.draft;
  };

  const statusConfig = getStatusConfig(invoice.status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  Invoice Details
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-mono font-medium text-primary">#{invoice.id.slice(0, 8)}</span>
                  <span>•</span>
                  <Badge variant={statusConfig.variant} className={statusConfig.className}>
                    {invoice.status}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPOSPrint(true)}
                  className="gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  POS Receipt
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowRegularPrint(true)}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Invoice
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="p-6 space-y-6">
              {/* Patient Information */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Patient Information
                </h3>
                {invoice.patients && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {invoice.patients.first_name} {invoice.patients.middle_name || ''} {invoice.patients.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">MRN</p>
                      <p className="font-medium font-mono">{invoice.patients.mrn}</p>
                    </div>
                    {invoice.patients.phone_mobile && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Phone
                        </p>
                        <p className="font-medium">{invoice.patients.phone_mobile}</p>
                      </div>
                    )}
                    {invoice.patients.email && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Email
                        </p>
                        <p className="font-medium">{invoice.patients.email}</p>
                      </div>
                    )}
                    {invoice.patients.address_line1 && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Address
                        </p>
                        <p className="font-medium">
                          {invoice.patients.address_line1}
                          {invoice.patients.address_line2 && `, ${invoice.patients.address_line2}`}
                          {invoice.patients.city && `, ${invoice.patients.city}`}
                          {invoice.patients.region && `, ${invoice.patients.region}`}
                          {invoice.patients.postal_code && ` ${invoice.patients.postal_code}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Invoice Dates */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Created
                  </div>
                  <p className="font-semibold">
                    {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(invoice.created_at), 'HH:mm')}
                  </p>
                </div>
                {invoice.issued_at && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <FileText className="h-4 w-4" />
                      Issued
                    </div>
                    <p className="font-semibold">
                      {format(new Date(invoice.issued_at), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(invoice.issued_at), 'HH:mm')}
                    </p>
                  </div>
                )}
                {invoice.due_date && (
                  <div className={`bg-card border rounded-lg p-4 ${isOverdue ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      Due Date
                    </div>
                    <p className={`font-semibold ${isOverdue ? 'text-destructive' : ''}`}>
                      {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                    </p>
                    {isOverdue && (
                      <p className="text-xs text-destructive mt-1 font-medium">
                        {Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Invoice Items</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-sm">Description</th>
                        <th className="text-right p-3 font-semibold text-sm">Quantity</th>
                        <th className="text-right p-3 font-semibold text-sm">Unit Price</th>
                        <th className="text-right p-3 font-semibold text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line: any, index: number) => (
                        <tr key={index} className="border-t border-border hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{line.description}</p>
                              {line.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{line.notes}</p>
                              )}
                            </div>
                          </td>
                          <td className="text-right p-3">{line.quantity || 1}</td>
                          <td className="text-right p-3 font-mono">
                            ${Number(line.unit_price || 0).toFixed(2)}
                          </td>
                          <td className="text-right p-3 font-mono font-semibold">
                            ${Number(line.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono font-semibold">
                      ${Number(invoice.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-success font-medium">Discount</span>
                        {invoice.discount_code && (
                          <Badge variant="outline" className="bg-success/10 text-success border-success text-xs">
                            {invoice.discount_code}
                          </Badge>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-success">
                        -${Number(invoice.discount_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-mono font-semibold">
                      ${Number(invoice.tax_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-semibold flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Total Amount
                    </span>
                    <span className="font-mono font-bold text-2xl text-primary">
                      ${Number(invoice.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  {invoice.balance_due > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-semibold flex items-center gap-2 text-destructive">
                          <CreditCard className="h-5 w-5" />
                          Balance Due
                        </span>
                        <span className="font-mono font-bold text-2xl text-destructive">
                          ${Number(invoice.balance_due || 0).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <InvoicePrintView
        invoice={invoice}
        open={showRegularPrint}
        onOpenChange={setShowRegularPrint}
      />

      <InvoicePOSPrint
        invoice={invoice}
        open={showPOSPrint}
        onOpenChange={setShowPOSPrint}
      />
    </>
  );
};