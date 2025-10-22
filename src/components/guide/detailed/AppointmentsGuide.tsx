import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar,
  Clock,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle2,
  Info,
  Zap,
  Bell,
  Video,
  Filter,
  Download,
  AlertCircle
} from "lucide-react";

export const AppointmentsGuide = () => {
  const features = [
    {
      icon: UserPlus,
      title: "Book New Appointment",
      description: "Schedule patient appointments efficiently",
      steps: [
        "Navigate to Appointments page",
        "Click 'New Appointment' button",
        "Search and select patient (or create new patient)",
        "Choose appointment type (Consultation, Follow-up, Procedure, etc.)",
        "Select provider from available staff",
        "Pick date and time from available slots",
        "Add appointment notes or special instructions",
        "Set reminder preferences (SMS/Email)",
        "Click 'Book Appointment' to confirm",
      ],
      tips: [
        "Green slots indicate available times",
        "System prevents double-booking automatically",
        "Recurring appointments can be set up for chronic care",
        "Walk-in appointments can be marked with 'Walk-in' flag",
        "Color-coded by appointment type for easy identification"
      ],
      shortcuts: ["Ctrl/Cmd + B: Book Appointment", "Ctrl/Cmd + S: Save"],
    },
    {
      icon: Calendar,
      title: "Calendar View",
      description: "Visualize and manage appointments",
      steps: [
        "Switch between Day, Week, and Month views",
        "Click on time slots to create new appointments",
        "Drag appointments to reschedule",
        "Click appointment to view/edit details",
        "Use color coding to identify appointment types",
        "Filter by provider, appointment type, or status",
        "Print daily schedule for front desk",
      ],
      tips: [
        "Hover over appointment for quick preview",
        "Right-click for context menu options",
        "Today button returns to current date",
        "Weekend slots can be hidden in settings",
        "Export calendar to Google Calendar or Outlook"
      ],
      shortcuts: ["Left/Right Arrow: Navigate Days", "T: Today", "D/W/M: Change View"],
    },
    {
      icon: Edit,
      title: "Reschedule Appointments",
      description: "Modify existing appointments",
      steps: [
        "Click on the appointment to reschedule",
        "Select 'Reschedule' from options",
        "Choose new date and time",
        "Optionally add reason for rescheduling",
        "System sends automatic notification to patient",
        "Confirm changes",
      ],
      tips: [
        "Drag-and-drop rescheduling in calendar view",
        "History tracks all reschedule events",
        "Batch reschedule available for provider changes",
        "No-show appointments can be rescheduled directly"
      ],
      shortcuts: ["Ctrl/Cmd + R: Reschedule Selected"],
    },
    {
      icon: Bell,
      title: "Appointment Reminders",
      description: "Automated patient notifications",
      steps: [
        "Navigate to Communications > Notification Templates",
        "Configure reminder timing (24h, 12h, 2h before)",
        "Customize SMS and Email templates",
        "Enable/disable per appointment type",
        "View reminder delivery status in logs",
      ],
      tips: [
        "Default: 24 hours before appointment",
        "SMS reminders have higher open rates",
        "Include appointment details and location",
        "Cancellation link can be embedded",
        "Track reminder effectiveness in reports"
      ],
      shortcuts: [],
    },
    {
      icon: CheckCircle2,
      title: "Check-in & No-shows",
      description: "Manage appointment status",
      steps: [
        "When patient arrives, mark as 'Checked In'",
        "Move to 'In Progress' when consultation starts",
        "Complete with 'Finished' status",
        "For no-shows, mark as 'No Show' after grace period",
        "Add notes about late arrivals or reasons",
      ],
      tips: [
        "Check-in can be done via iPad at reception",
        "No-show patterns tracked for reporting",
        "Grace period configurable (default 15 min)",
        "Automatic queue integration on check-in",
        "SMS check-in links available"
      ],
      shortcuts: ["C: Check In", "F: Finish", "N: No Show"],
    },
    {
      icon: Video,
      title: "Telemedicine Appointments",
      description: "Virtual consultation setup",
      steps: [
        "Select 'Telemedicine' as appointment type",
        "System generates unique video link",
        "Link automatically sent to patient email",
        "Provider joins from Online Consultation page",
        "Video call starts at appointment time",
        "Session recorded for compliance (if enabled)",
      ],
      tips: [
        "Test video/audio before first patient",
        "Screen sharing available for reviewing results",
        "Chat feature for sharing links/documents",
        "E-prescription integrated in video interface",
        "Waiting room prevents early joins"
      ],
      shortcuts: ["Ctrl/Cmd + V: Join Video Call"],
    },
  ];

  const appointmentTypes = [
    { name: "Consultation", duration: "30 min", color: "bg-blue-500" },
    { name: "Follow-up", duration: "15 min", color: "bg-green-500" },
    { name: "Procedure", duration: "60 min", color: "bg-purple-500" },
    { name: "Lab Work", duration: "15 min", color: "bg-yellow-500" },
    { name: "Telemedicine", duration: "30 min", color: "bg-cyan-500" },
    { name: "Emergency", duration: "30 min", color: "bg-red-500" },
  ];

  const statuses = [
    { name: "Scheduled", color: "text-blue-600", icon: Clock },
    { name: "Confirmed", color: "text-green-600", icon: CheckCircle2 },
    { name: "Checked In", color: "text-purple-600", icon: UserPlus },
    { name: "In Progress", color: "text-orange-600", icon: Clock },
    { name: "Completed", color: "text-green-700", icon: CheckCircle2 },
    { name: "No Show", color: "text-red-600", icon: AlertCircle },
    { name: "Cancelled", color: "text-gray-600", icon: Trash2 },
  ];

  const faqs = [
    {
      question: "How do I handle overlapping appointments?",
      answer: "The system prevents double-booking automatically. If you need to override, use 'Force Book' option. Providers will see a warning for overlapping slots."
    },
    {
      question: "Can patients book appointments themselves?",
      answer: "Yes! Enable the Public Booking Portal in Configuration. Patients receive a unique link to book available slots. Approval can be required or automatic."
    },
    {
      question: "What happens when a provider calls in sick?",
      answer: "Use 'Bulk Reschedule' to move all appointments to another provider or date. System sends automatic notifications to affected patients with options."
    },
    {
      question: "How do I set up recurring appointments?",
      answer: "When booking, enable 'Recurring' and set frequency (daily, weekly, monthly). Define end date or number of occurrences. All instances created at once."
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <CardHeader className="relative">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Appointments Guide
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Master appointment scheduling, calendar management, and patient notifications
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
              <Calendar className="h-5 w-5 text-purple-600" />
              Appointment Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {appointmentTypes.map((type, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${type.color}`} />
                  <span className="font-medium">{type.name}</span>
                </div>
                <Badge variant="outline">{type.duration}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Appointment Statuses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statuses.map((status, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <status.icon className={`h-4 w-4 ${status.color}`} />
                <span className="font-medium">{status.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Features */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Detailed Feature Guides</CardTitle>
          <CardDescription>Click on each feature to expand and view detailed instructions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {features.map((feature, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
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

                    {/* Tips */}
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
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
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
