import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { format } from "date-fns";
import { useRef } from "react";

interface InvoicePOSPrintProps {
  invoice: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InvoicePOSPrint = ({ invoice, open, onOpenChange }: InvoicePOSPrintProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const lines = Array.isArray(invoice.lines) ? invoice.lines : [];

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=600,width=400');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>POS Receipt</title>');
    printWindow.document.write(`
      <style>
        @media print {
          body { 
            margin: 0; 
            padding: 10px;
            font-family: 'Courier New', monospace;
          }
          .no-print { display: none; }
          @page { 
            size: 80mm auto;
            margin: 5mm;
          }
        }
        body {
          font-family: 'Courier New', monospace;
          line-height: 1.4;
          color: #000;
          max-width: 300px;
          margin: 0 auto;
          font-size: 12px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .divider { 
          border-top: 1px dashed #000; 
          margin: 8px 0;
        }
        .double-divider { 
          border-top: 2px solid #000; 
          margin: 8px 0;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .line-item {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }
        .total-section {
          margin-top: 10px;
          border-top: 2px solid #000;
          padding-top: 8px;
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
      <DialogContent className="max-w-md max-h-[90vh] p-0">
        <div className="flex items-center justify-between p-4 border-b border-border no-print">
          <h2 className="text-lg font-semibold">POS Receipt Preview</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-auto max-h-[calc(90vh-80px)] p-6 bg-white">
          <div 
            ref={printRef} 
            style={{ 
              fontFamily: "'Courier New', monospace", 
              maxWidth: '300px', 
              margin: '0 auto',
              fontSize: '12px',
              color: '#000'
            }}
          >
            {/* Header */}
            <div className="header">
              <div className="bold" style={{ fontSize: '16px' }}>HEALTHCARE CLINIC</div>
              <div style={{ fontSize: '10px', marginTop: '4px' }}>
                123 Medical Center Drive<br />
                Healthcare City, HC 12345<br />
                Tel: (555) 123-4567
              </div>
            </div>

            <div className="double-divider"></div>

            {/* Invoice Info */}
            <div style={{ marginBottom: '10px' }}>
              <div className="line-item">
                <span>Invoice #:</span>
                <span className="bold">{invoice.id.slice(0, 8)}</span>
              </div>
              <div className="line-item">
                <span>Date:</span>
                <span>{format(new Date(invoice.created_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              <div className="line-item">
                <span>Status:</span>
                <span className="bold">{invoice.status.toUpperCase()}</span>
              </div>
            </div>

            <div className="divider"></div>

            {/* Patient Info */}
            {invoice.patients && (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <div className="bold">PATIENT:</div>
                  <div>{invoice.patients.first_name} {invoice.patients.last_name}</div>
                  <div style={{ fontSize: '10px' }}>MRN: {invoice.patients.mrn}</div>
                  {invoice.patients.phone_mobile && (
                    <div style={{ fontSize: '10px' }}>Tel: {invoice.patients.phone_mobile}</div>
                  )}
                </div>
                <div className="divider"></div>
              </>
            )}

            {/* Line Items */}
            <div style={{ marginBottom: '10px' }}>
              {lines.map((line: any, index: number) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  <div className="bold">{line.description}</div>
                  <div className="line-item" style={{ fontSize: '11px' }}>
                    <span>{line.quantity || 1} x ${Number(line.unit_price || 0).toFixed(2)}</span>
                    <span className="bold">${Number(line.total || 0).toFixed(2)}</span>
                  </div>
                  {line.notes && (
                    <div style={{ fontSize: '10px', marginTop: '2px', marginLeft: '10px' }}>
                      Note: {line.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="divider"></div>

            {/* Totals */}
            <div className="total-section">
              <div className="line-item">
                <span>Subtotal:</span>
                <span>${Number(invoice.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="line-item">
                <span>Tax:</span>
                <span>${Number(invoice.tax_amount || 0).toFixed(2)}</span>
              </div>
              <div className="double-divider"></div>
              <div className="line-item bold" style={{ fontSize: '14px' }}>
                <span>TOTAL:</span>
                <span>${Number(invoice.total_amount || 0).toFixed(2)}</span>
              </div>
              {invoice.balance_due > 0 && (
                <>
                  <div className="divider"></div>
                  <div className="line-item bold" style={{ fontSize: '14px' }}>
                    <span>AMOUNT DUE:</span>
                    <span>${Number(invoice.balance_due || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="double-divider"></div>

            {/* Footer */}
            <div className="text-center" style={{ fontSize: '10px', marginTop: '10px' }}>
              <div className="bold">THANK YOU!</div>
              <div style={{ marginTop: '8px' }}>
                {invoice.due_date && (
                  <div>Payment Due: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}</div>
                )}
                <div style={{ marginTop: '4px' }}>
                  Please retain this receipt<br />
                  for your records
                </div>
              </div>
            </div>

            <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '10px' }}>
              <div>*** OFFICIAL RECEIPT ***</div>
              <div style={{ marginTop: '4px' }}>
                {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};