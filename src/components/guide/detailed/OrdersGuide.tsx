import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardList,
  Microscope,
  Activity,
  FileCheck,
  Upload,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Keyboard,
  AlertCircle,
} from "lucide-react";

export const OrdersGuide = () => {
  const features = [
    {
      icon: ClipboardList,
      title: "Creating Orders",
      description: "Order lab tests, imaging, and procedures",
      steps: [
        "Navigate to Orders from sidebar",
        "Click 'Create Order' button",
        "Select patient from dropdown or search",
        "Choose order type: Lab, Imaging, Procedure, or Other",
        "Select specific tests/procedures from catalog",
        "Add multiple tests to same order if needed",
        "Set priority: Routine, Urgent, or STAT (immediate)",
        "Add clinical notes or special instructions",
        "Review order details and costs",
        "Submit order - patient/doctor receives notification",
      ],
      tips: [
        "Group related tests in single order for efficiency",
        "STAT orders are processed immediately - use for emergencies only",
        "Include clinical indication for insurance authorization",
        "Check if patient requires fasting or special preparation",
        "Pre-authorize with insurance if required",
      ],
      shortcuts: [
        "Use order templates for common test combinations",
        "Favorite frequently ordered tests for quick access",
        "Duplicate previous orders to save time",
        "Ctrl+Enter to submit order quickly",
      ],
    },
    {
      icon: FileCheck,
      title: "Orders Worklist",
      description: "Track and manage all facility orders",
      steps: [
        "Go to Orders page to view worklist",
        "See all orders with status: Pending, In Progress, Completed, Cancelled",
        "Filter by order type, status, date, or priority",
        "Search for specific patient or order number",
        "Click order card to view full details",
        "Update order status as work progresses",
        "Add internal notes for technicians",
        "Mark as completed when results ready",
      ],
      tips: [
        "Color-coded priority helps identify urgent orders",
        "Real-time updates show new orders immediately",
        "Use filters to focus on your department's orders",
        "Sort by date to process oldest orders first",
        "Quick status update from worklist view",
      ],
      shortcuts: [
        "Quick filters for Today, Pending, STAT orders",
        "Click patient name to view full medical history",
        "Print order requisition for lab/imaging department",
        "Export worklist to CSV for tracking",
      ],
    },
    {
      icon: Upload,
      title: "Uploading Results",
      description: "Attach and document test results",
      steps: [
        "Find completed order in worklist",
        "Click 'Upload Results' button",
        "Drag and drop result files (PDF, images, reports)",
        "OR browse to select files from computer",
        "Add result summary or findings in text field",
        "Mark critical/abnormal findings if present",
        "Set result status: Normal, Abnormal, Critical",
        "Click 'Upload' to save results",
        "Ordering physician receives automatic notification",
        "Results appear in patient's clinical records",
      ],
      tips: [
        "Supported formats: PDF, JPG, PNG, DICOM for imaging",
        "Multiple files can be uploaded for same order",
        "Flag critical results for immediate physician attention",
        "Include interpretation notes for complex results",
        "Results are timestamped and audit-tracked",
      ],
      shortcuts: [
        "Drag-drop multiple files at once",
        "Use result templates for standardized reporting",
        "Quick toggle for Normal/Abnormal flags",
        "Preview uploaded documents before submitting",
      ],
    },
    {
      icon: Activity,
      title: "Tracking Order Status",
      description: "Monitor order progress and completion",
      steps: [
        "View order status in real-time on dashboard",
        "Status flow: Pending → In Progress → Completed",
        "Receive notifications when status changes",
        "Track turnaround time for each order",
        "Monitor overdue orders (past expected completion)",
        "View order history and audit trail",
        "Export status reports for management",
      ],
      tips: [
        "Set expected turnaround times per test type",
        "Overdue alerts help identify delays",
        "Patient can also track order status in portal",
        "Status history shows who made changes and when",
        "Use analytics to improve order processing times",
      ],
      shortcuts: [
        "Dashboard widget shows pending order count",
        "Click status badge to see detailed timeline",
        "Filter by overdue to prioritize delays",
        "Set up email alerts for critical results",
      ],
    },
    {
      icon: Microscope,
      title: "Lab-Specific Workflow",
      description: "Special features for laboratory orders",
      steps: [
        "Receive order in lab worklist",
        "Generate specimen labels with barcodes",
        "Collect specimen and scan barcode",
        "Update status to 'Sample Collected'",
        "Process sample in lab equipment",
        "Enter results manually or import from analyzer",
        "Quality control and verification by pathologist",
        "Upload signed report with results",
        "Mark order as 'Completed'",
      ],
      tips: [
        "Barcode scanning prevents specimen mix-ups",
        "Track specimen from collection to disposal",
        "Some analyzers can auto-import results",
        "Electronic signature for result verification",
        "Critical values trigger immediate notification",
      ],
      shortcuts: [
        "Barcode scanner integration for speed",
        "Batch processing for multiple samples",
        "Auto-populate results from previous similar tests",
        "Result templates for common panels",
      ],
    },
  ];

  const orderTypes = [
    { type: "Laboratory", description: "Blood tests, urine analysis, cultures", icon: "🧪" },
    { type: "Imaging", description: "X-ray, CT, MRI, ultrasound", icon: "📷" },
    { type: "Procedures", description: "Endoscopy, ECG, biopsy", icon: "🔬" },
    { type: "Other", description: "Consultations, therapies, custom orders", icon: "📋" },
  ];

  const priorityLevels = [
    { priority: "Routine", description: "Standard turnaround time (24-48 hours)", color: "secondary" },
    { priority: "Urgent", description: "Expedited processing (4-8 hours)", color: "default" },
    { priority: "STAT", description: "Immediate processing (<1 hour)", color: "destructive" },
  ];

  const orderStatuses = [
    { status: "Draft", description: "Order being created, not yet submitted" },
    { status: "Pending", description: "Order submitted, awaiting processing" },
    { status: "Sample Collected", description: "Specimen collected for lab tests" },
    { status: "In Progress", description: "Test/procedure being performed" },
    { status: "Results Available", description: "Results uploaded, pending review" },
    { status: "Completed", description: "Results reviewed and finalized" },
    { status: "Cancelled", description: "Order cancelled before completion" },
  ];

  const faqs = [
    {
      q: "Can I modify an order after submitting it?",
      a: "Yes, but only if the order is still in 'Pending' status. Once processing starts (In Progress or beyond), you cannot modify it. Instead, cancel the original order and create a new corrected one. Document the reason for cancellation in notes.",
    },
    {
      q: "How do I handle a STAT order emergency?",
      a: "Create order and set priority to 'STAT'. The lab/department receives immediate notification with high-priority alert. They'll process it ahead of all routine orders. STAT orders must have clinical justification. System tracks STAT turnaround times for quality monitoring.",
    },
    {
      q: "What if lab results are critical/abnormal?",
      a: "When uploading results, flag them as 'Critical' or 'Abnormal'. The ordering physician receives immediate notification via SMS and email. Critical results are highlighted in patient's chart. Follow facility policy for verbal notification of critical results.",
    },
    {
      q: "Can patients see their test results?",
      a: "Depends on facility policy configured in Settings. Typically, results are released to patient portal after physician review. Critical results require physician consultation before release. Patients receive notification when results are available.",
    },
    {
      q: "How do I track orders pending for too long?",
      a: "Use 'Overdue Orders' filter on worklist. System automatically flags orders past expected turnaround time. Dashboard shows count of overdue orders. Set up email alerts for orders overdue by X hours. Export overdue report for management review.",
    },
    {
      q: "What if wrong test was ordered?",
      a: "If not yet started (Pending status), edit the order to correct tests. If already In Progress, cancel the order with reason 'Ordered in error' and create new correct order. If sample already collected, contact lab to discuss if it can be used for correct test.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <ClipboardList className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl">Orders Management Guide</CardTitle>
              <CardDescription className="text-base mt-1">
                Complete guide to ordering, tracking, and managing lab tests and procedures
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
              <ClipboardList className="h-5 w-5 text-primary" />
              Order Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderTypes.map((item) => (
              <div key={item.type} className="flex items-start gap-3 p-3 rounded-lg bg-accent/5">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold">{item.type}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Priority Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityLevels.map((item) => (
              <div key={item.priority} className="flex items-start gap-3">
                <Badge variant={item.color as any} className="mt-0.5">{item.priority}</Badge>
                <div className="flex-1 text-sm text-muted-foreground">{item.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Order Statuses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Order Status Flow
          </CardTitle>
          <CardDescription>Understanding order lifecycle and status transitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {orderStatuses.map((item, index) => (
              <div key={item.status} className="p-3 rounded-lg border bg-accent/5">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                  <div className="font-semibold text-sm">{item.status}</div>
                </div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Microscope className="h-5 w-5 text-primary" />
            Feature Guides
          </CardTitle>
          <CardDescription>Step-by-step instructions for order management</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={features[0].title} className="w-full">
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-5 h-auto">
              {features.map((feature) => (
                <TabsTrigger key={feature.title} value={feature.title} className="gap-2">
                  <feature.icon className="h-4 w-4" />
                  {feature.title.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {features.map((feature) => (
              <TabsContent key={feature.title} value={feature.title} className="space-y-6 mt-6">
                <div className="flex items-start gap-4 p-4 bg-accent/10 rounded-lg">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>

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
              </TabsContent>
            ))}
          </Tabs>
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
                <li>• Include clinical indication for all orders</li>
                <li>• Use appropriate priority levels - don't overuse STAT</li>
                <li>• Document special preparation instructions</li>
                <li>• Update status promptly as work progresses</li>
                <li>• Flag critical results immediately</li>
                <li>• Verify patient identity before specimen collection</li>
                <li>• Follow facility protocols for order authorization</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-destructive">✗ Don't</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Order tests without clinical justification</li>
                <li>• Mark all orders as STAT (defeats the purpose)</li>
                <li>• Ignore required patient preparation</li>
                <li>• Leave orders in pending status indefinitely</li>
                <li>• Release critical results without physician notification</li>
                <li>• Process orders without proper patient consent</li>
                <li>• Skip quality control steps for speed</li>
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
