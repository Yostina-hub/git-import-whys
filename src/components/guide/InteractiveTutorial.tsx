import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface Step {
  title: string;
  description: string;
  action: string;
  tip?: string;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  steps: Step[];
  category: string;
}

export const InteractiveTutorial = () => {
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const tutorials: Tutorial[] = [
    {
      id: "register-patient",
      title: "Register a New Patient",
      description: "Interactive guide to complete patient registration",
      estimatedTime: "3 minutes",
      category: "Patient Management",
      steps: [
        {
          title: "Navigate to Patients",
          description: "Click on the Patients menu item in the sidebar",
          action: "Click 'Patients' in the navigation menu",
          tip: "You can also use the keyboard shortcut Ctrl+P",
        },
        {
          title: "Click Add Patient",
          description: "Find and click the 'Add Patient' button in the top right",
          action: "Click the 'Add Patient' button",
        },
        {
          title: "Fill Basic Information",
          description: "Enter the patient's first name, last name, and date of birth",
          action: "Complete the basic information fields",
          tip: "All fields marked with * are required",
        },
        {
          title: "Add Contact Details",
          description: "Enter mobile phone, email, and address information",
          action: "Fill in contact information",
        },
        {
          title: "Review and Submit",
          description: "Double-check all information before submitting",
          action: "Click 'Register Patient'",
          tip: "You can edit patient information later if needed",
        },
      ],
    },
    {
      id: "create-appointment",
      title: "Schedule an Appointment",
      description: "Learn how to book patient appointments",
      estimatedTime: "2 minutes",
      category: "Appointments",
      steps: [
        {
          title: "Go to Appointments",
          description: "Navigate to the appointments section",
          action: "Click 'Appointments' in the menu",
        },
        {
          title: "Select Date & Time",
          description: "Choose the appointment date and time slot",
          action: "Click on the desired time slot in the calendar",
        },
        {
          title: "Select Patient",
          description: "Search for and select the patient",
          action: "Use the patient search to find the patient",
          tip: "Start typing the patient's name or MRN",
        },
        {
          title: "Choose Provider & Service",
          description: "Select the healthcare provider and service type",
          action: "Select provider and service from dropdowns",
        },
        {
          title: "Confirm Booking",
          description: "Review details and confirm the appointment",
          action: "Click 'Book Appointment'",
        },
      ],
    },
    {
      id: "create-invoice",
      title: "Generate Patient Invoice",
      description: "Step-by-step invoice creation process",
      estimatedTime: "4 minutes",
      category: "Billing",
      steps: [
        {
          title: "Navigate to Billing",
          description: "Go to the billing section",
          action: "Click 'Billing' in the navigation",
        },
        {
          title: "Create New Invoice",
          description: "Start a new invoice",
          action: "Click 'Create Invoice' button",
        },
        {
          title: "Select Patient",
          description: "Choose the patient for this invoice",
          action: "Search and select the patient",
        },
        {
          title: "Add Services",
          description: "Add the services or items to bill",
          action: "Click 'Add Service' and select items",
          tip: "You can add multiple services to one invoice",
        },
        {
          title: "Apply Discounts (Optional)",
          description: "Add any applicable discounts or coupons",
          action: "Enter discount code if available",
        },
        {
          title: "Review and Issue",
          description: "Check the total and issue the invoice",
          action: "Click 'Issue Invoice'",
        },
      ],
    },
  ];

  const selected = tutorials.find((t) => t.id === selectedTutorial);

  const handleNext = () => {
    if (selected && currentStep < selected.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsPlaying(false);
  };

  const handleSelectTutorial = (id: string) => {
    setSelectedTutorial(id);
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsPlaying(false);
  };

  const progress = selected ? ((currentStep + 1) / selected.steps.length) * 100 : 0;

  if (!selectedTutorial || !selected) {
    return (
      <div className="space-y-4">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Interactive Tutorials
            </CardTitle>
            <CardDescription>
              Choose a tutorial to begin hands-on learning with step-by-step guidance
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutorials.map((tutorial) => (
            <Card
              key={tutorial.id}
              className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all border-2 group"
              onClick={() => handleSelectTutorial(tutorial.id)}
            >
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">
                  {tutorial.category}
                </Badge>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {tutorial.title}
                </CardTitle>
                <CardDescription>{tutorial.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{tutorial.estimatedTime}</span>
                  <Button size="sm" variant="ghost" className="group-hover:bg-primary/10">
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="outline" className="mb-2">
                {selected.category}
              </Badge>
              <CardTitle>{selected.title}</CardTitle>
              <CardDescription>{selected.description}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedTutorial(null)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              All Tutorials
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                Step {currentStep + 1} of {selected.steps.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {currentStep + 1}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{selected.steps[currentStep].title}</CardTitle>
              <CardDescription className="text-base mt-2">
                {selected.steps[currentStep].description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Action */}
          <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-primary mb-1">Action Required</div>
                <div>{selected.steps[currentStep].action}</div>
              </div>
            </div>
          </div>

          {/* Tip */}
          {selected.steps[currentStep].tip && (
            <div className="p-4 bg-yellow-500/5 border-2 border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm text-yellow-600 mb-1">💡 Pro Tip</div>
                  <div className="text-sm">{selected.steps[currentStep].tip}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentStep === selected.steps.length - 1}
            >
              {currentStep === selected.steps.length - 1 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* All Steps Overview */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">All Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {selected.steps.map((step, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  index === currentStep
                    ? "border-primary bg-primary/5"
                    : completedSteps.includes(index)
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-transparent hover:border-muted-foreground/20"
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      index === currentStep
                        ? "bg-primary text-primary-foreground"
                        : completedSteps.includes(index)
                        ? "bg-green-500 text-white"
                        : "bg-muted"
                    }`}
                  >
                    {completedSteps.includes(index) ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
