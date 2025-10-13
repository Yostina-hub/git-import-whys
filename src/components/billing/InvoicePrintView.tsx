import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, Printer } from "lucide-react";
import { format } from "date-fns";
import { useRef } from "react";

interface InvoicePrintViewProps {
  invoice: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InvoicePrintView = ({ invoice, open, onOpenChange }: InvoicePrintViewProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const lines = Array.isArray(invoice.lines) ? invoice.lines : [];

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Invoice</title>');
    printWindow.document.write(`
      <style>
        @media print {
          body { 
            margin: 0; 
            padding: 20px;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .no-print { display: none; }
          @page { margin: 1cm; }
        }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          color: #1a1a1a;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
        }
        th, td { 
          padding: 12px; 
          text-align: left; 
          border-bottom: 1px solid #e5e7eb;
        }
        th { 
          background-color: #f3f4f6; 
          font-weight: 600;
        }
        .text-right { text-align: right; }
        .totals-section {
          background: linear-gradient(to bottom right, #eff6ff, #dbeafe);
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .header-section {
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #3b82f6;
        }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="flex items-center justify-between p-4 border-b border-border no-print">
          <h2 className="text-lg font-semibold">Print Preview</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-auto max-h-[calc(90vh-80px)] p-8 bg-white text-foreground">
          <div ref={printRef}>
            {/* Header */}
            <div className="header-section">
              <div className="flex justify-between items-start">
                <div>
                  <div className="logo">HEALTHCARE CLINIC</div>
                  <p className="text-sm text-gray-600 mt-2">
                    123 Medical Center Drive<br />
                    Healthcare City, HC 12345<br />
                    Phone: (555) 123-4567<br />
                    Email: billing@healthcare.com
                  </p>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Invoice #:</strong> {invoice.id.slice(0, 8)}<br />
                    <strong>Date:</strong> {format(new Date(invoice.created_at), 'MMMM dd, yyyy')}<br />
                    {invoice.due_date && (
                      <><strong>Due Date:</strong> {format(new Date(invoice.due_date), 'MMMM dd, yyyy')}<br /></>
                    )}
                    <strong>Status:</strong> <span style={{ 
                      textTransform: 'uppercase', 
                      color: invoice.status === 'paid' ? '#10b981' : invoice.status === 'partial' ? '#f59e0b' : '#6b7280'
                    }}>{invoice.status}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Patient Information */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3" style={{ color: '#3b82f6' }}>Bill To:</h3>
              {invoice.patients && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-lg">
                    {invoice.patients.first_name} {invoice.patients.middle_name || ''} {invoice.patients.last_name}
                  </p>
                  <p className="text-sm text-gray-600">MRN: {invoice.patients.mrn}</p>
                  {invoice.patients.phone_mobile && (
                    <p className="text-sm text-gray-600">Phone: {invoice.patients.phone_mobile}</p>
                  )}
                  {invoice.patients.email && (
                    <p className="text-sm text-gray-600">Email: {invoice.patients.email}</p>
                  )}
                  {invoice.patients.address_line1 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {invoice.patients.address_line1}
                      {invoice.patients.address_line2 && `, ${invoice.patients.address_line2}`}<br />
                      {invoice.patients.city && `${invoice.patients.city}, `}
                      {invoice.patients.region && `${invoice.patients.region} `}
                      {invoice.patients.postal_code && invoice.patients.postal_code}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line: any, index: number) => (
                  <tr key={index}>
                    <td>
                      <strong>{line.description}</strong>
                      {line.notes && (
                        <div className="text-sm text-gray-600 mt-1">{line.notes}</div>
                      )}
                    </td>
                    <td className="text-right">{line.quantity || 1}</td>
                    <td className="text-right">${Number(line.unit_price || 0).toFixed(2)}</td>
                    <td className="text-right"><strong>${Number(line.total || 0).toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="totals-section">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">${Number(invoice.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tax:</span>
                  <span className="font-semibold">${Number(invoice.tax_amount || 0).toFixed(2)}</span>
                </div>
                <div style={{ height: '1px', background: '#cbd5e1', margin: '12px 0' }}></div>
                <div className="flex justify-between text-xl">
                  <span className="font-bold">Total Amount:</span>
                  <span className="font-bold" style={{ color: '#3b82f6' }}>
                    ${Number(invoice.total_amount || 0).toFixed(2)}
                  </span>
                </div>
                {invoice.balance_due > 0 && (
                  <>
                    <div style={{ height: '1px', background: '#cbd5e1', margin: '12px 0' }}></div>
                    <div className="flex justify-between text-xl">
                      <span className="font-bold" style={{ color: '#ef4444' }}>Amount Due:</span>
                      <span className="font-bold" style={{ color: '#ef4444' }}>
                        ${Number(invoice.balance_due || 0).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-300 text-sm text-gray-600 text-center">
              <p>Thank you for your business!</p>
              <p className="mt-2">
                Payment is due within {invoice.due_date ? 
                  Math.ceil((new Date(invoice.due_date).getTime() - new Date(invoice.created_at).getTime()) / (1000 * 60 * 60 * 24)) 
                  : '30'} days. Please include invoice number with payment.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};