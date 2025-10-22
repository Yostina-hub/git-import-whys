import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  FileText,
  CreditCard,
  RefreshCw,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Keyboard,
  Package,
  Percent,
  Receipt,
} from "lucide-react";

export const BillingGuide = () => {
  const features = [
    {
      icon: FileText,
      title: "Invoice Management",
      description: "Create and manage patient invoices",
      steps: [
        "Navigate to Billing from sidebar",
        "Click 'Create Invoice' button",
        "Select patient from dropdown or search",
        "Choose billing type: Service, Package, or Custom",
        "Add services/items - quantities auto-calculate totals",
        "Apply discounts or coupons if applicable",
        "Review tax calculations (configured in settings)",
        "Save as Draft or Finalize invoice",
        "Print or email invoice to patient",
      ],
      tips: [
        "Use package invoices for bundled services to save time",
        "Draft invoices are saved automatically - return anytime to complete",
        "Invoice numbers are auto-generated sequentially",
        "Add custom line items for services not in catalog",
        "Review discount policies before applying manual discounts",
      ],
      shortcuts: [
        "Ctrl+N for new invoice",
        "Use service quick search to add items faster",
        "Click patient name to view billing history",
        "Export invoices to CSV for accounting",
      ],
    },
    {
      icon: CreditCard,
      title: "Payment Processing",
      description: "Record and track patient payments",
      steps: [
        "Open an invoice from the billing list",
        "Click 'Record Payment' button",
        "Enter payment amount (can be partial or full)",
        "Select payment method: Cash, Card, Insurance, Mobile Money, etc.",
        "Add transaction reference number if applicable",
        "Enter any payment notes or instructions",
        "Click 'Record Payment' to save",
        "System automatically updates invoice status (Paid/Partially Paid)",
        "Print payment receipt for patient",
      ],
      tips: [
        "Record partial payments as patients pay installments",
        "Use transaction references for easier reconciliation",
        "Payment receipts include all transaction details",
        "View payment history from invoice details",
        "Export payment reports for accounting",
      ],
      shortcuts: [
        "Click 'Quick Pay' for full invoice payment",
        "Use recent payment methods for faster entry",
        "Search invoices by payment status",
        "Filter by payment method for reconciliation",
      ],
    },
    {
      icon: Package,
      title: "Package Billing",
      description: "Bill for service packages and bundles",
      steps: [
        "Go to Packages tab in Billing",
        "View available service packages",
        "Click 'Create Package Invoice' on patient",
        "Select package from dropdown",
        "System auto-populates all package services",
        "Package discount is applied automatically",
        "Review and adjust if needed (some packages allow customization)",
        "Finalize and process payment",
        "Track package service usage over time",
      ],
      tips: [
        "Packages offer better value - promote to patients",
        "Some packages allow partial service substitution",
        "Track remaining services in package on invoice",
        "Set expiry dates for time-limited packages",
        "Create custom packages for VIP patients",
      ],
      shortcuts: [
        "Search packages by name or category",
        "View most popular packages for quick access",
        "Clone existing packages to create variations",
        "Export package sales reports",
      ],
    },
    {
      icon: RefreshCw,
      title: "Refunds",
      description: "Process refunds and credit notes",
      steps: [
        "Navigate to Billing > Refunds tab",
        "Find invoice requiring refund",
        "Click 'Create Refund' button",
        "Select refund type: Full or Partial",
        "Enter refund amount and reason (required)",
        "Choose refund method (original payment method recommended)",
        "Add approval notes if required by policy",
        "Submit refund for processing",
        "Print refund receipt for records",
        "Original invoice status updates automatically",
      ],
      tips: [
        "Document refund reasons thoroughly for audit trail",
        "Partial refunds useful for service cancellations",
        "Refunds create negative invoices in accounting",
        "Get manager approval for large refunds if policy requires",
        "Track refund trends to identify service issues",
      ],
      shortcuts: [
        "Filter refunds by date or status",
        "Search by invoice number or patient",
        "Export refund reports for accounting",
        "View refund history per patient",
      ],
    },
    {
      icon: Percent,
      title: "Discounts & Coupons",
      description: "Apply discounts and promotional codes",
      steps: [
        "During invoice creation, scroll to discount section",
        "Choose discount type: Percentage or Fixed Amount",
        "Enter discount value",
        "OR enter coupon code in coupon field",
        "System validates coupon and applies automatically",
        "Review adjusted total",
        "Add discount reason/notes (may be required)",
        "Finalize invoice with discount applied",
      ],
      tips: [
        "Coupon codes are case-sensitive",
        "Some discounts require manager approval",
        "View discount policies in Configuration > Discounts",
        "Senior citizens and staff may have automatic discounts",
        "Track discount usage to prevent abuse",
      ],
      shortcuts: [
        "Recent coupons appear in dropdown for quick selection",
        "Discount exemption policies auto-apply based on patient category",
        "View discount impact in billing reports",
        "Create time-limited promotional codes",
      ],
    },
    {
      icon: BarChart3,
      title: "Financial Reports",
      description: "Generate revenue and payment reports",
      steps: [
        "Go to Billing > Reports section",
        "Select report type: Revenue, Payments, Outstanding, Refunds",
        "Choose date range (today, week, month, custom)",
        "Apply filters: payment method, service category, doctor, etc.",
        "Click 'Generate Report' to view",
        "Analyze charts and tables",
        "Export to PDF or CSV",
        "Schedule automated reports via email (optional)",
      ],
      tips: [
        "Run end-of-day reports for cash reconciliation",
        "Monitor outstanding invoices weekly",
        "Compare month-over-month revenue trends",
        "Identify top revenue-generating services",
        "Use reports for financial planning",
      ],
      shortcuts: [
        "Save favorite report configurations",
        "Quick filters for common time periods",
        "Export directly to accounting software",
        "Email reports to management automatically",
      ],
    },
  ];

  const paymentMethods = [
    { method: "Cash", description: "Physical currency payment", icon: "💵" },
    { method: "Credit/Debit Card", description: "Card payment via POS or online", icon: "💳" },
    { method: "Mobile Money", description: "M-Pesa, MTN, Airtel Money, etc.", icon: "📱" },
    { method: "Bank Transfer", description: "Direct bank deposit or transfer", icon: "🏦" },
    { method: "Insurance", description: "Insurance claim payment", icon: "🛡️" },
    { method: "Cheque", description: "Bank cheque payment", icon: "📝" },
  ];

  const invoiceStatuses = [
    { status: "Draft", description: "Invoice created but not finalized", color: "secondary" },
    { status: "Pending", description: "Invoice finalized, awaiting payment", color: "default" },
    { status: "Partially Paid", description: "Partial payment received", color: "default" },
    { status: "Paid", description: "Fully paid invoice", color: "default" },
    { status: "Overdue", description: "Payment past due date", color: "destructive" },
    { status: "Cancelled", description: "Invoice cancelled/voided", color: "secondary" },
  ];

  const faqs = [
    {
      q: "How do I void an incorrect invoice?",
      a: "Open the invoice and click 'Cancel Invoice'. Add a cancellation reason (required for audit). The invoice will be marked as cancelled but remains in system for records. If payment was received, process a refund first. Create a new correct invoice if needed.",
    },
    {
      q: "Can I edit an invoice after it's paid?",
      a: "No, paid invoices cannot be edited to maintain financial integrity. If changes are needed: 1) Create a refund for the incorrect amount, 2) Create a new corrected invoice, 3) Document the reason in notes. This creates proper audit trail.",
    },
    {
      q: "How do I handle insurance billing?",
      a: "Create invoice normally but select 'Insurance' as payment method. Enter claim number and insurance details. Mark as paid when insurance processes claim. Track pending insurance payments in Outstanding Reports. Follow up on unpaid claims regularly.",
    },
    {
      q: "What if a patient can't pay in full?",
      a: "Accept partial payments! Record the amount paid, system tracks balance automatically. Create payment plan if needed. Send payment reminders for outstanding balance. Flag invoice as 'Payment Plan' in notes for tracking.",
    },
    {
      q: "How do I reconcile daily cash collections?",
      a: "Run End of Day Report > Payment Report > Filter by Cash > Today. System shows all cash transactions. Compare total to physical cash. Investigate any discrepancies. Export report for accounting records. Close cash drawer after reconciliation.",
    },
    {
      q: "Can I offer discounts without approval?",
      a: "Depends on your facility's policy configured in Settings. Typically: discounts under 10% are auto-approved, 10-25% require manager approval, over 25% require admin approval. System enforces these rules. Check your discount policy in Configuration.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl">Billing & Payment Guide</CardTitle>
              <CardDescription className="text-base mt-1">
                Complete guide to invoicing, payments, and financial management
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Reference */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((item) => (
              <div key={item.method} className="flex items-start gap-3 p-3 rounded-lg bg-accent/5">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold">{item.method}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Invoice Statuses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoiceStatuses.map((item) => (
              <div key={item.status} className="flex items-start gap-3">
                <Badge variant={item.color as any} className="mt-0.5">{item.status}</Badge>
                <div className="flex-1 text-sm text-muted-foreground">{item.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Feature Guides
          </CardTitle>
          <CardDescription>Comprehensive billing and payment instructions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {features.map((feature, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{feature.title}</div>
                      <div className="text-sm text-muted-foreground">{feature.description}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4">
                    {/* Steps */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        Step-by-Step Guide
                      </h4>
                      <div className="space-y-2">
                        {feature.steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/5 transition-colors">
                            <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                            <p className="text-sm flex-1">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Pro Tips */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Pro Tips
                      </h4>
                      <div className="space-y-2">
                        {feature.tips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Shortcuts */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Keyboard className="h-4 w-4 text-primary" />
                        Quick Actions & Shortcuts
                      </h4>
                      <div className="space-y-2">
                        {feature.shortcuts.map((shortcut, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm p-2 rounded bg-accent/5">
                            <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span>{shortcut}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="border-2 border-accent/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-success">✓ Do</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Finalize invoices before accepting payment</li>
                <li>• Always provide printed receipts for cash payments</li>
                <li>• Record transaction references for card/mobile payments</li>
                <li>• Reconcile cash daily at end of shift</li>
                <li>• Document reasons for discounts and refunds</li>
                <li>• Follow up on overdue invoices promptly</li>
                <li>• Export financial reports for accounting monthly</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-destructive">✗ Don't</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Accept payment without creating proper invoice</li>
                <li>• Edit invoices after they're paid</li>
                <li>• Apply discounts without proper authorization</li>
                <li>• Delete invoices (cancel them instead)</li>
                <li>• Mix personal and facility funds</li>
                <li>• Process refunds without documentation</li>
                <li>• Ignore payment discrepancies</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">{faq.q}</h4>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
