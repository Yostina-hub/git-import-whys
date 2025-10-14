import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign,
  Receipt,
  CreditCard,
  FileText,
  Package,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info,
  Zap,
  Percent
} from "lucide-react";

export const BillingGuide = () => {
  const features = [
    {
      icon: Receipt,
      title: "Invoice Management",
      description: "Create and manage patient invoices",
      steps: [
        "Navigate to Billing page",
        "Click 'Create Invoice' button",
        "Select patient from search",
        "Choose services from service catalog",
        "Quantities and unit prices auto-populate",
        "Apply discounts or tax if needed",
        "Review total amount",
        "Save as Draft or Issue invoice",
        "Print or email invoice to patient",
      ],
      tips: [
        "Invoices in Draft status can be edited",
        "Issued invoices are locked and require refund process",
        "Bulk invoicing available for package treatments",
        "Auto-calculate tax based on service categories",
        "Email invoices directly from the system"
      ],
      shortcuts: ["Ctrl/Cmd + I: New Invoice", "Ctrl/Cmd + P: Print Invoice"],
    },
    {
      icon: CreditCard,
      title: "Payment Processing",
      description: "Record and track patient payments",
      steps: [
        "Open invoice from Billing list",
        "Click 'Record Payment' button",
        "Select payment method (Cash, Card, Insurance, etc.)",
        "Enter payment amount",
        "Add transaction reference if applicable",
        "Payment auto-updates invoice status",
        "Partial payments create Outstanding balance",
        "Full payment marks invoice as Paid",
        "Receipt auto-generated and printable",
      ],
      tips: [
        "Multiple payment methods supported per invoice",
        "Payment gateway integration for online payments",
        "Insurance claim tracking built-in",
        "Automated payment reminders for overdue invoices",
        "Daily payment reconciliation reports"
      ],
      shortcuts: ["Ctrl/Cmd + R: Record Payment"],
    },
    {
      icon: Package,
      title: "Package Billing",
      description: "Manage treatment packages and subscriptions",
      steps: [
        "Navigate to Packages tab",
        "Click 'Create Package'",
        "Define package name and description",
        "Add included services with quantities",
        "Set package price (usually discounted)",
        "Set validity period (days/months)",
        "Assign package to patient",
        "System tracks service utilization",
        "Alerts when package expires or depletes",
      ],
      tips: [
        "Packages can include multiple service types",
        "Track remaining sessions in real-time",
        "Auto-deduct from package during appointments",
        "Renewal reminders before expiration",
        "Package analytics show most popular bundles"
      ],
      shortcuts: [],
    },
    {
      icon: RefreshCw,
      title: "Refunds & Adjustments",
      description: "Process refunds and billing corrections",
      steps: [
        "Locate original invoice",
        "Click 'Create Refund' action",
        "Select refund reason from dropdown",
        "Choose full or partial refund",
        "Enter refund amount if partial",
        "Add notes explaining refund",
        "Select refund method (original payment method recommended)",
        "Approve refund (requires authorization)",
        "Credit note auto-generated",
      ],
      tips: [
        "Refunds create audit trail for compliance",
        "Approval workflow for refunds over set amount",
        "Credit notes can be applied to future invoices",
        "Refund reports track financial impact",
        "Integration with accounting software"
      ],
      shortcuts: [],
    },
    {
      icon: Percent,
      title: "Discounts & Coupons",
      description: "Apply discounts and promotional codes",
      steps: [
        "Navigate to Configuration > Discounts",
        "Click 'Create Discount Rule'",
        "Set discount type (Percentage or Fixed Amount)",
        "Define eligibility criteria (services, patients, dates)",
        "Set discount value",
        "Create coupon code (optional)",
        "Set usage limits and expiration",
        "Activate discount rule",
        "Apply during invoice creation",
      ],
      tips: [
        "Senior citizen and insurance discounts can be automatic",
        "Loyalty programs with tiered discounts",
        "Time-based promotions (happy hours)",
        "Referral discounts tracked per patient",
        "Discount analytics show effectiveness"
      ],
      shortcuts: [],
    },
    {
      icon: TrendingUp,
      title: "Financial Reports",
      description: "Revenue analytics and reporting",
      steps: [
        "Go to Billing > Reports",
        "Select report type (Revenue, Payments, Outstanding, etc.)",
        "Set date range",
        "Apply filters (service type, provider, payment method)",
        "View summary charts and tables",
        "Drill down into specific transactions",
        "Export to Excel or PDF",
        "Schedule automated report emails",
      ],
      tips: [
        "Daily revenue summaries in dashboard",
        "Aging reports for outstanding invoices",
        "Provider-wise revenue breakdown",
        "Service popularity and profitability analysis",
        "Tax reports for compliance"
      ],
      shortcuts: [],
    },
  ];

  const paymentMethods = [
    { name: "Cash", description: "Physical currency payments" },
    { name: "Credit/Debit Card", description: "Card payments via POS or gateway" },
    { name: "Insurance", description: "Insurance claim processing" },
    { name: "Bank Transfer", description: "Direct bank transfers" },
    { name: "Digital Wallet", description: "Mobile payment apps" },
    { name: "Check", description: "Bank check payments" },
  ];

  const invoiceStatuses = [
    { status: "Draft", color: "gray", description: "Invoice created but not issued, editable" },
    { status: "Issued", color: "blue", description: "Sent to patient, awaiting payment" },
    { status: "Partially Paid", color: "yellow", description: "Some payment received, balance due" },
    { status: "Paid", color: "green", description: "Fully paid, closed" },
    { status: "Overdue", color: "red", description: "Past due date, payment pending" },
    { status: "Cancelled", color: "gray", description: "Invoice cancelled or voided" },
  ];

  const faqs = [
    {
      question: "Can I edit an invoice after it's been issued?",
      answer: "No, issued invoices are locked for audit compliance. To make changes, you must cancel the original invoice and create a new one, or issue a credit note for adjustments."
    },
    {
      question: "How do I handle split payments between insurance and patient?",
      answer: "Create one invoice with all charges. Record two separate payments: one from insurance and one from patient (copay). The system tracks both payment sources."
    },
    {
      question: "What happens if a patient doesn't pay on time?",
      answer: "System automatically marks invoices as Overdue after due date. You can send automated reminders, apply late fees (if configured), or flag patient account until payment received."
    },
    {
      question: "How do I integrate with accounting software?",
      answer: "Navigate to Configuration > Integrations. Connect to QuickBooks, Xero, or other supported platforms. Transactions sync automatically based on your settings."
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <CardHeader className="relative">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Billing & Payments Guide
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Complete financial management, invoicing, and payment processing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Reference */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((method, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg space-y-1">
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-muted-foreground">{method.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Invoice Statuses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoiceStatuses.map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Features Tabs */}
      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {features.map((feature, idx) => (
          <TabsContent key={idx} value={feature.title.toLowerCase().split(' ')[0]}>
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base mt-1">{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Step-by-Step Guide</h3>
                  </div>
                  <div className="space-y-3">
                    {feature.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                          {stepIdx + 1}
                        </div>
                        <div className="flex-1 pt-1">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold">Pro Tips</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {feature.tips.map((tip, tipIdx) => (
                      <div key={tipIdx} className="flex gap-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                        <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {feature.shortcuts.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {feature.shortcuts.map((shortcut, scIdx) => (
                          <Badge key={scIdx} variant="outline" className="text-sm px-4 py-2">
                            {shortcut}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Best Practices */}
      <Card className="border-2 border-blue-500/50 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <AlertCircle className="h-5 w-5" />
            Billing Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              Always verify patient insurance coverage before treatment to avoid billing disputes
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              Issue invoices immediately after service delivery for better cash flow
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              Reconcile daily payments before end of day to catch discrepancies early
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              Send payment reminders 3 days before due date to reduce late payments
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 bg-muted/30 rounded-lg space-y-2">
              <h4 className="font-semibold text-primary">{faq.question}</h4>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
