import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  UserPlus, 
  Search, 
  FileText, 
  Heart, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar
} from "lucide-react";

export const PatientManagementGuide = () => {
  const features = [
    {
      icon: UserPlus,
      title: "Patient Registration",
      description: "Complete patient onboarding process",
      steps: [
        "Click 'New Patient' button in the top right",
        "Fill in required fields: First Name, Last Name, Date of Birth",
        "Add contact information: Phone, Email, Address",
        "Select Insurance Provider (if applicable)",
        "Add Emergency Contact details",
        "Review and click 'Register Patient'",
      ],
      tips: [
        "Use Tab key to navigate between fields quickly",
        "Date of Birth auto-calculates patient age",
        "Email is required for appointment reminders",
        "Insurance info can be added later if needed"
      ],
      shortcuts: ["Ctrl/Cmd + N: New Patient", "Ctrl/Cmd + S: Save"],
    },
    {
      icon: Search,
      title: "Patient Search & Filter",
      description: "Find patients quickly and efficiently",
      steps: [
        "Use the search bar at the top to search by name, phone, or ID",
        "Click filter icon to access advanced filters",
        "Filter by: Age Range, Gender, Insurance, Registration Date",
        "Use 'Recent Patients' for quick access to last viewed",
        "Click 'Clear Filters' to reset all filters",
      ],
      tips: [
        "Search works on partial matches",
        "Use Ctrl/Cmd + K for quick search anywhere",
        "Recent patients are cached for 24 hours",
        "Export filtered results to CSV for reports"
      ],
      shortcuts: ["Ctrl/Cmd + K: Quick Search", "Ctrl/Cmd + F: Advanced Filter"],
    },
    {
      icon: Eye,
      title: "View Patient Details",
      description: "Access complete patient information",
      steps: [
        "Click on any patient card to view details",
        "Navigate tabs: Demographics, Clinical, Documents, Visits",
        "View patient timeline and visit history",
        "Check active medications and allergies",
        "Review billing history and outstanding balances",
        "Access uploaded documents and images",
      ],
      tips: [
        "Use arrow keys to navigate between tabs",
        "Click patient photo to view/update",
        "Timeline shows chronological patient journey",
        "Red badges indicate critical alerts (allergies)"
      ],
      shortcuts: ["Enter: Open Selected Patient", "Esc: Close Details"],
    },
    {
      icon: Edit,
      title: "Update Patient Information",
      description: "Modify patient records safely",
      steps: [
        "Open patient details view",
        "Click 'Edit' button in top right",
        "Modify required fields",
        "Changes are auto-saved as you type",
        "Review changes in the audit log",
        "Click 'Save Changes' to confirm",
      ],
      tips: [
        "All changes are tracked in audit log",
        "Critical fields require confirmation",
        "Photo updates are instant",
        "Bulk updates available for multiple patients"
      ],
      shortcuts: ["Ctrl/Cmd + E: Edit Mode", "Ctrl/Cmd + S: Save"],
    },
    {
      icon: FileText,
      title: "Patient Documents",
      description: "Manage patient files and records",
      steps: [
        "Navigate to patient's Documents tab",
        "Click 'Upload Document' button",
        "Select document type (Lab Report, Imaging, Consent Form, etc.)",
        "Drag & drop files or browse",
        "Add document description and tags",
        "Click 'Upload' to save",
      ],
      tips: [
        "Supported formats: PDF, JPG, PNG, DOCX",
        "Maximum file size: 10MB per document",
        "Use tags for easy organization",
        "Documents are encrypted at rest"
      ],
      shortcuts: ["Ctrl/Cmd + U: Upload", "Ctrl/Cmd + D: Download"],
    },
    {
      icon: Calendar,
      title: "Patient Appointments",
      description: "Schedule and manage patient visits",
      steps: [
        "From patient details, click 'Book Appointment'",
        "Select appointment type and provider",
        "Choose available date and time slot",
        "Add appointment notes",
        "Set reminder preferences",
        "Confirm booking",
      ],
      tips: [
        "Color-coded by appointment type",
        "Automatic reminder sent 24h before",
        "Double-booking prevention enabled",
        "Recurring appointments supported"
      ],
      shortcuts: ["Ctrl/Cmd + B: Book Appointment"],
    },
  ];

  const faqs = [
    {
      question: "How do I merge duplicate patient records?",
      answer: "Navigate to Admin > User Management > Merge Patients. Select the duplicate records and choose which one to keep as the master record. All clinical data will be consolidated."
    },
    {
      question: "Can I import patients from another system?",
      answer: "Yes! Go to Patients > Import. Download our CSV template, fill in patient data, and upload. The system will validate and import records with a detailed report."
    },
    {
      question: "What happens to patient data when deleted?",
      answer: "Patient records are soft-deleted and moved to archive. They can be restored within 30 days. After 30 days, data is permanently deleted per HIPAA compliance."
    },
    {
      question: "How do I set up custom patient fields?",
      answer: "Navigate to Configuration > Patient Fields. Click 'Add Field', choose field type (text, number, dropdown), set as required/optional, and save. Fields appear in registration form."
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <CardHeader className="relative">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Patient Management Guide
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Complete guide to patient registration, search, and record management
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">6</div>
            <div className="text-sm text-muted-foreground">Core Features</div>
          </CardContent>
        </Card>
        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-cyan-600">25+</div>
            <div className="text-sm text-muted-foreground">Step-by-Step Guides</div>
          </CardContent>
        </Card>
        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">15+</div>
            <div className="text-sm text-muted-foreground">Pro Tips</div>
          </CardContent>
        </Card>
        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">10</div>
            <div className="text-sm text-muted-foreground">Shortcuts</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Feature Guides */}
      <Tabs defaultValue="registration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="registration" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden md:inline">Register</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search</span>
          </TabsTrigger>
          <TabsTrigger value="view" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden md:inline">View</span>
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-2">
            <Edit className="h-4 w-4" />
            <span className="hidden md:inline">Edit</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden md:inline">Appointments</span>
          </TabsTrigger>
        </TabsList>

        {features.map((feature, idx) => (
          <TabsContent key={idx} value={feature.title.toLowerCase().split(' ')[1] || feature.title.toLowerCase()}>
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base mt-1">{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step-by-Step Guide */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Step-by-Step Instructions</h3>
                  </div>
                  <div className="space-y-3">
                    {feature.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-all">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                          {stepIdx + 1}
                        </div>
                        <div className="flex-1 pt-1">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Pro Tips */}
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

                <Separator />

                {/* Keyboard Shortcuts */}
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
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

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
