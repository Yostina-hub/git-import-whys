import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText,
  Heart,
  Pill,
  Activity,
  AlertTriangle,
  FileCheck,
  Clipboard,
  CheckCircle2,
  Info,
  Zap,
  Shield,
  Lock
} from "lucide-react";

export const ClinicalRecordsGuide = () => {
  const features = [
    {
      icon: FileText,
      title: "EMR Notes",
      description: "Electronic medical record documentation",
      steps: [
        "Navigate to Clinical Records page",
        "Select patient from list or search",
        "Click 'EMR Notes' tab",
        "Click 'Add Note' button",
        "Select note type (Progress Note, SOAP, Consultation, etc.)",
        "Fill in Chief Complaint and History of Present Illness",
        "Document examination findings",
        "Add assessment and plan",
        "Sign and lock note when complete",
      ],
      tips: [
        "Use templates to save time on common conditions",
        "Voice-to-text available for faster documentation",
        "Auto-save prevents data loss",
        "Locked notes cannot be edited (compliance)",
        "Addendum feature for corrections after locking"
      ],
      shortcuts: ["Ctrl/Cmd + N: New Note", "Ctrl/Cmd + L: Lock Note"],
    },
    {
      icon: Activity,
      title: "Vital Signs",
      description: "Record patient vital measurements",
      steps: [
        "Open patient's Vital Signs tab",
        "Click 'Add Vital Signs'",
        "Enter measurements: BP, HR, Temp, RR, SpO2, Weight, Height",
        "BMI auto-calculated from height and weight",
        "Add pain scale (0-10) if applicable",
        "Note who took the vitals and timestamp",
        "Save to patient record",
      ],
      tips: [
        "Abnormal values highlighted in red",
        "Trend charts show vital changes over time",
        "Compare with previous readings",
        "Alerts for critical values",
        "Mobile device integration available"
      ],
      shortcuts: ["Ctrl/Cmd + V: Add Vitals"],
    },
    {
      icon: Pill,
      title: "Medications",
      description: "Manage patient medication lists",
      steps: [
        "Navigate to Medications tab",
        "Click 'Add Medication'",
        "Search drug database or type custom medication",
        "Specify dosage, route, and frequency",
        "Set start date and duration",
        "Add special instructions",
        "Mark as active or discontinued",
        "Link to prescribing provider",
      ],
      tips: [
        "Drug interaction checking automatic",
        "Allergy cross-checking before prescribing",
        "Medication reconciliation on each visit",
        "Refill tracking and alerts",
        "E-prescription integration available"
      ],
      shortcuts: ["Ctrl/Cmd + M: Add Medication"],
    },
    {
      icon: AlertTriangle,
      title: "Allergies & Alerts",
      description: "Track allergies and clinical alerts",
      steps: [
        "Open Allergies tab",
        "Click 'Add Allergy'",
        "Select allergen type (Drug, Food, Environmental)",
        "Choose specific allergen from database",
        "Describe reaction (rash, anaphylaxis, etc.)",
        "Set severity (Mild, Moderate, Severe)",
        "Save and allergy appears on all clinical screens",
      ],
      tips: [
        "Red banner shows on patient chart",
        "Prevents prescribing contraindicated drugs",
        "Appears in appointment booking",
        "Required field cannot be bypassed",
        "Historical allergies can be marked inactive"
      ],
      shortcuts: ["Ctrl/Cmd + A: Add Allergy"],
    },
    {
      icon: FileCheck,
      title: "Assessments & Protocols",
      description: "Clinical assessment tools",
      steps: [
        "Select Assessments tab",
        "Choose assessment type (PHQ-9, GAD-7, Falls Risk, etc.)",
        "Complete questionnaire with patient",
        "System auto-scores based on responses",
        "View risk stratification",
        "Add clinical interpretation",
        "Protocol recommendations displayed",
        "Save to patient timeline",
      ],
      tips: [
        "30+ validated assessment tools",
        "Trending shows improvement over time",
        "Protocol-driven care suggestions",
        "Patient-facing versions available",
        "Integration with treatment plans"
      ],
      shortcuts: [],
    },
    {
      icon: Clipboard,
      title: "Consent Forms",
      description: "Digital consent management",
      steps: [
        "Navigate to Consents tab",
        "Select consent type (Treatment, Surgery, Privacy, etc.)",
        "Review form with patient",
        "Patient signs on touchscreen or tablet",
        "Provider counter-signs",
        "PDF generated and attached to chart",
        "Email copy to patient (optional)",
      ],
      tips: [
        "Legally binding digital signatures",
        "Audit trail for compliance",
        "Multi-language forms available",
        "Custom consent forms can be created",
        "Expiration tracking for time-limited consents"
      ],
      shortcuts: [],
    },
  ];

  const noteTypes = [
    { name: "SOAP Note", description: "Subjective, Objective, Assessment, Plan" },
    { name: "Progress Note", description: "Follow-up visit documentation" },
    { name: "Consultation Note", description: "Specialist consultation record" },
    { name: "Procedure Note", description: "Procedure documentation" },
    { name: "Discharge Summary", description: "Hospital discharge notes" },
    { name: "Transfer Summary", description: "Transfer of care documentation" },
  ];

  const vitalRanges = [
    { vital: "Blood Pressure", normal: "90/60 - 120/80 mmHg", alert: "< 90/60 or > 140/90" },
    { vital: "Heart Rate", normal: "60-100 bpm", alert: "< 60 or > 100 bpm" },
    { vital: "Temperature", normal: "36.1-37.2°C (97-99°F)", alert: "< 36°C or > 38°C" },
    { vital: "Respiratory Rate", normal: "12-20 breaths/min", alert: "< 12 or > 24" },
    { vital: "SpO2", normal: "95-100%", alert: "< 95%" },
    { vital: "BMI", normal: "18.5-24.9", alert: "< 18.5 or > 30" },
  ];

  const faqs = [
    {
      question: "Can I edit a locked EMR note?",
      answer: "No, locked notes are legally binding and cannot be edited. Use the Addendum feature to add corrections or updates while preserving the original note."
    },
    {
      question: "How do I create custom note templates?",
      answer: "Navigate to Configuration > Clinical Templates. Click 'New Template', add sections and fields, save. Templates appear in note type dropdown."
    },
    {
      question: "What happens if I prescribe a medication the patient is allergic to?",
      answer: "System blocks the prescription and shows a red alert with the allergy details and reaction type. You must override with justification (e.g., desensitization protocol)."
    },
    {
      question: "How long are clinical records stored?",
      answer: "Clinical records are stored indefinitely per medical record retention laws. Deleted records are archived for 7 years before permanent deletion."
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <CardHeader className="relative">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Clinical Records Guide
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Comprehensive EMR documentation, vitals tracking, and clinical workflows
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
              <FileText className="h-5 w-5 text-green-600" />
              Note Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {noteTypes.map((type, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg space-y-1">
                <div className="font-medium">{type.name}</div>
                <div className="text-sm text-muted-foreground">{type.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Normal Vital Ranges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {vitalRanges.map((range, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                <div className="font-medium text-sm mb-1">{range.vital}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600">✓ {range.normal}</span>
                  <span className="text-red-600">⚠ {range.alert}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Features Tabs */}
      <Tabs defaultValue="emr" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="emr">EMR Notes</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="allergies">Allergies</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="consents">Consents</TabsTrigger>
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

      {/* Security Notice */}
      <Card className="border-2 border-green-500/50 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Shield className="h-5 w-5" />
            HIPAA Compliance & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 items-start">
            <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              All clinical data is encrypted at rest and in transit using AES-256 encryption
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              Audit logs track every access and modification to patient records
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              Role-based access control ensures only authorized personnel can view clinical data
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
