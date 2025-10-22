import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  TrendingUp,
  Clock,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  UserCog,
  BarChart3,
  Settings,
  Lightbulb,
  Keyboard,
} from "lucide-react";

export const QueueManagementGuide = () => {
  const features = [
    {
      icon: AlertTriangle,
      title: "Triage Queue",
      description: "Initial patient assessment and prioritization",
      steps: [
        "Navigate to Triage Queue from the sidebar",
        "View incoming patients waiting for triage",
        "Click 'Start Assessment' on a patient card",
        "Record chief complaint, vital signs, and priority level",
        "Assign priority: Immediate (Red), Urgent (Orange), Standard (Yellow), Non-urgent (Green)",
        "Route patient to appropriate doctor or department",
        "Save assessment - patient automatically moves to doctor queue",
      ],
      tips: [
        "Use color-coded priority badges for quick visual assessment",
        "The 'Actions' button provides quick access to patient details and queue operations",
        "Wait time is calculated automatically from check-in time",
        "Complete triage within recommended timeframes based on priority",
      ],
      shortcuts: [
        "Click Actions button (pulsing outline) for queue operations",
        "Use filters to show only specific priority levels",
        "Sort by wait time to address longest-waiting patients first",
      ],
    },
    {
      icon: UserCog,
      title: "Doctor Queue",
      description: "Manage patients assigned to specific doctors",
      steps: [
        "Go to Doctor Queue page",
        "View patients assigned to you or select a doctor",
        "See patient status: Waiting, Called, In Progress, Completed",
        "Click 'Call Patient' to change status to 'Called'",
        "Click 'Start Consultation' to begin clinical assessment",
        "During consultation: Record EMR notes, prescriptions, orders",
        "Complete consultation - patient moves to next step (billing/checkout)",
        "View queue statistics for performance tracking",
      ],
      tips: [
        "Queue automatically updates in real-time as patients are triaged",
        "Preview patient details before calling them using the preview button",
        "Track average consultation time to optimize patient flow",
        "Use bulk actions for managing multiple patients",
      ],
      shortcuts: [
        "Use quick search to find specific patients in queue",
        "Filter by status to focus on specific workflow stages",
        "Click patient card for detailed clinical history",
      ],
    },
    {
      icon: Monitor,
      title: "Queue Display",
      description: "Public display board for patient notifications",
      steps: [
        "Navigate to Queue Display page",
        "Display shows on large screen/TV in waiting area",
        "Patients see their queue number and status",
        "Real-time updates when status changes",
        "Configure display settings (font size, colors, layout)",
        "Customize messages and announcements",
      ],
      tips: [
        "Use fullscreen mode (F11) for clean display",
        "Set auto-refresh to ensure real-time updates",
        "Include multilingual support for diverse patient populations",
        "Show estimated wait times to manage patient expectations",
      ],
      shortcuts: [
        "F11 for fullscreen mode",
        "Configure settings to match your clinic branding",
        "Enable sound notifications for better patient awareness",
      ],
    },
    {
      icon: BarChart3,
      title: "Queue Analytics",
      description: "Track queue performance and identify bottlenecks",
      steps: [
        "Access Queue Analytics from Queue Management page",
        "View real-time metrics: patients in queue, average wait time, completion rate",
        "Analyze by time period (today, this week, this month)",
        "Identify peak hours and resource needs",
        "Monitor individual doctor performance",
        "Export reports for management review",
      ],
      tips: [
        "Use analytics to optimize staff scheduling",
        "Track trends over time to improve patient flow",
        "Set target metrics for wait times and completion rates",
        "Review bottlenecks weekly to implement improvements",
      ],
      shortcuts: [
        "Date range picker for custom period analysis",
        "Export CSV for detailed data analysis",
        "Filter by department or doctor for specific insights",
      ],
    },
    {
      icon: Settings,
      title: "Routing Rules",
      description: "Configure automatic patient routing",
      steps: [
        "Go to Queue Management > Settings",
        "Define routing rules based on chief complaint, priority, or specialty",
        "Set default doctors for specific conditions",
        "Configure overflow rules when doctors are busy",
        "Enable automatic queue balancing",
        "Test rules before activating",
        "Monitor rule effectiveness in analytics",
      ],
      tips: [
        "Start with simple rules and gradually add complexity",
        "Review routing effectiveness monthly",
        "Include backup rules for when primary doctor is unavailable",
        "Consider patient preferences in routing logic",
      ],
      shortcuts: [
        "Duplicate existing rules to create variations",
        "Use templates for common routing scenarios",
        "Enable/disable rules without deleting them",
      ],
    },
  ];

  const priorityLevels = [
    { level: "Immediate", color: "bg-destructive", description: "Life-threatening, requires immediate attention", example: "Cardiac arrest, severe trauma" },
    { level: "Urgent", color: "bg-warning", description: "Serious condition, requires prompt care within 30 min", example: "Chest pain, severe bleeding" },
    { level: "Standard", color: "bg-yellow-500", description: "Stable but needs attention within 1-2 hours", example: "Moderate pain, infections" },
    { level: "Non-urgent", color: "bg-success", description: "Minor conditions, can wait 2-4 hours", example: "Minor injuries, follow-ups" },
  ];

  const queueStatuses = [
    { status: "Waiting", description: "Patient checked in, waiting for triage", color: "secondary" },
    { status: "In Triage", description: "Undergoing triage assessment", color: "default" },
    { status: "Triaged", description: "Triage complete, assigned to doctor queue", color: "default" },
    { status: "Called", description: "Doctor has called patient", color: "default" },
    { status: "In Progress", description: "Currently in consultation", color: "default" },
    { status: "Completed", description: "Consultation finished, ready for next step", color: "default" },
  ];

  const faqs = [
    {
      q: "How do I handle emergency patients?",
      a: "Emergency patients should bypass normal triage and be assigned 'Immediate' priority (red). Use the quick-add function to add them directly to the doctor queue with highest priority. The system will automatically place them at the top of the queue.",
    },
    {
      q: "What if a doctor is running behind schedule?",
      a: "Queue analytics will show increased wait times. You can: 1) Reassign patients to available doctors, 2) Notify patients of delays via SMS, 3) Activate overflow routing rules, or 4) Add a temporary provider to help clear the backlog.",
    },
    {
      q: "How do I balance load across multiple doctors?",
      a: "Enable automatic queue balancing in routing rules. The system will distribute patients evenly based on: current queue length, average consultation time, and doctor availability. You can also manually reassign patients using the Actions button.",
    },
    {
      q: "Can patients see their queue position?",
      a: "Yes, if you have the Queue Display enabled. Patients can see their queue number, current status, and estimated wait time on the public display board. You can also send SMS notifications with queue updates.",
    },
    {
      q: "How do I prioritize follow-up patients?",
      a: "In triage assessment, select 'Follow-up' as visit type. You can configure routing rules to automatically assign follow-ups to their primary doctor. Set appropriate priority based on clinical urgency, not just visit type.",
    },
    {
      q: "What happens if triage is skipped?",
      a: "Patients can be added directly to doctor queues with default priority. However, this is not recommended as triage ensures proper prioritization and initial assessment. Use only for scheduled appointments or non-urgent cases.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl">Queue Management Guide</CardTitle>
              <CardDescription className="text-base mt-1">
                Master patient flow from triage to consultation
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
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Priority Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityLevels.map((priority) => (
              <div key={priority.level} className="flex items-start gap-3 p-3 rounded-lg bg-accent/5">
                <div className={`w-3 h-3 rounded-full ${priority.color} mt-1.5`} />
                <div className="flex-1">
                  <div className="font-semibold">{priority.level}</div>
                  <div className="text-sm text-muted-foreground">{priority.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">Example: {priority.example}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Queue Statuses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queueStatuses.map((item, index) => (
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
            <Users className="h-5 w-5 text-primary" />
            Feature Guides
          </CardTitle>
          <CardDescription>Step-by-step instructions for each queue feature</CardDescription>
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
                    Quick Actions
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
                <li>• Prioritize based on clinical urgency, not arrival time</li>
                <li>• Update queue status promptly for accurate wait times</li>
                <li>• Monitor queue analytics daily to identify bottlenecks</li>
                <li>• Communicate wait times clearly to patients</li>
                <li>• Use triage for all walk-in patients</li>
                <li>• Review and adjust routing rules regularly</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-destructive">✗ Don't</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Skip triage for walk-in patients (except true emergencies)</li>
                <li>• Ignore high-priority patients in favor of scheduled appointments</li>
                <li>• Leave patients in "Called" status for extended periods</li>
                <li>• Manually override priority without clinical justification</li>
                <li>• Forget to close completed consultations</li>
                <li>• Neglect patient communication during long waits</li>
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
