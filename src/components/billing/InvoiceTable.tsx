import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, FileText, Calendar, DollarSign, CreditCard, ArrowUpDown, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { RecordPaymentDialog } from "./RecordPaymentDialog";
import { InvoiceDetailsDialog } from "./InvoiceDetailsDialog";

interface InvoiceTableProps {
  invoices: any[];
  onPaymentRecorded: () => void;
}

type SortKey = 'id' | 'patient' | 'total_amount' | 'balance_due' | 'status' | 'date';
type SortOrder = 'asc' | 'desc' | null;

export const InvoiceTable = ({ invoices, onPaymentRecorded }: InvoiceTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortKey(null);
        setSortOrder(null);
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-40" />;
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    if (sortOrder === 'desc') {
      return <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-40" />;
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (!sortKey || !sortOrder) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortKey) {
      case 'id':
        aValue = a.id;
        bValue = b.id;
        break;
      case 'patient':
        aValue = a.patients ? `${a.patients.first_name} ${a.patients.last_name}`.toLowerCase() : '';
        bValue = b.patients ? `${b.patients.first_name} ${b.patients.last_name}`.toLowerCase() : '';
        break;
      case 'total_amount':
        aValue = Number(a.total_amount || 0);
        bValue = Number(b.total_amount || 0);
        break;
      case 'balance_due':
        aValue = Number(a.balance_due || 0);
        bValue = Number(b.balance_due || 0);
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'date':
        aValue = new Date(a.issued_at || a.created_at).getTime();
        bValue = new Date(b.issued_at || b.created_at).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: any; className: string }> = {
      draft: { variant: "outline", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
      issued: { variant: "default", className: "bg-blue-600" },
      paid: { variant: "default", className: "bg-green-600" },
      partial: { variant: "secondary", className: "bg-yellow-600" },
      refunded: { variant: "outline", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
      void: { variant: "destructive", className: "" },
    };
    return configs[status] || configs.draft;
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('id')}
              >
                <span className="flex items-center">
                  Invoice #
                  {getSortIcon('id')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('patient')}
              >
                <span className="flex items-center">
                  Patient
                  {getSortIcon('patient')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="font-semibold">Description</TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('total_amount')}
              >
                <span className="flex items-center">
                  Total Amount
                  {getSortIcon('total_amount')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('balance_due')}
              >
                <span className="flex items-center">
                  Balance Due
                  {getSortIcon('balance_due')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('status')}
              >
                <span className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 font-semibold hover:bg-transparent"
                onClick={() => handleSort('date')}
              >
                <span className="flex items-center">
                  Date
                  {getSortIcon('date')}
                </span>
              </Button>
            </TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvoices.map((invoice) => {
            const lines = Array.isArray(invoice.lines) ? invoice.lines : [];
            const description = lines.length > 0 ? lines[0].description || "Invoice" : "Invoice";
            const statusConfig = getStatusConfig(invoice.status);
            const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.balance_due > 0;

            return (
              <TableRow 
                key={invoice.id} 
                className={`hover:bg-muted/30 transition-colors ${isOverdue ? 'border-l-4 border-l-destructive' : ''}`}
              >
                <TableCell className="font-mono font-medium text-primary">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    #{invoice.id.slice(0, 8)}
                  </div>
                </TableCell>
                <TableCell>
                  {invoice.patients && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {invoice.patients.first_name} {invoice.patients.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          MRN: {invoice.patients.mrn}
                        </div>
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {description}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 font-semibold">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    ${Number(invoice.total_amount || 0).toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>
                  {invoice.balance_due > 0 ? (
                    <div className="flex items-center gap-2 font-semibold text-destructive">
                      <CreditCard className="h-4 w-4" />
                      ${Number(invoice.balance_due || 0).toFixed(2)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">$0.00</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig.variant} className={statusConfig.className}>
                      {invoice.status}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {invoice.issued_at 
                      ? new Date(invoice.issued_at).toLocaleDateString()
                      : new Date(invoice.created_at).toLocaleDateString()
                    }
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedInvoice(invoice)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    {invoice.balance_due > 0 && invoice.status !== 'void' && (
                      <RecordPaymentDialog 
                        invoice={invoice} 
                        onPaymentRecorded={onPaymentRecorded} 
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {selectedInvoice && (
        <InvoiceDetailsDialog
          invoice={selectedInvoice}
          open={!!selectedInvoice}
          onOpenChange={(open) => !open && setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
