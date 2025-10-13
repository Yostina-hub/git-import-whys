import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Play, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Step {
  id: string;
  title: string;
  description: string;
  time: string;
  path: string;
  completed: boolean;
}

export const QuickStartGuide = () => {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<Step[]>([
    {
      id: "1",
      title: "Register Your First Patient",
      description: "Learn how to add patient demographics and complete registration",
      time: "2 min",
      path: "/patients",
      completed: false,
    },
    {
      id: "2",
      title: "Schedule an Appointment",
      description: "Book appointments and manage the calendar",
      time: "3 min",
      path: "/appointments",
      completed: false,
    },
    {
      id: "3",
      title: "Create Clinical Records",
      description: "Document EMR notes, vitals, and medications",
      time: "5 min",
      path: "/clinical",
      completed: false,
    },
    {
      id: "4",
      title: "Generate an Invoice",
      description: "Create and manage patient invoices and payments",
      time: "3 min",
      path: "/billing",
      completed: false,
    },
    {
      id: "5",
      title: "Manage the Queue",
      description: "Handle triage and doctor queues efficiently",
      time: "4 min",
      path: "/queue-management",
      completed: false,
    },
    {
      id: "6",
      title: "Run Reports",
      description: "Generate analytics and performance reports",
      time: "3 min",
      path: "/reports",
      completed: false,
    },
  ]);

  const toggleComplete = (id: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, completed: !step.completed } : step))
    );
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Progress</span>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {completedCount} / {steps.length}
            </Badge>
          </CardTitle>
          <CardDescription>Complete these steps to master the basics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground text-center mt-2">
              {progress === 100 ? "🎉 All steps completed!" : `${Math.round(progress)}% complete`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="grid gap-4">
        {steps.map((step, index) => (
          <Card
            key={step.id}
            className={`group cursor-pointer transition-all duration-300 border-2 ${
              step.completed
                ? "border-green-500/50 bg-green-500/5"
                : "hover:border-primary/50 hover:shadow-lg"
            }`}
            onClick={() => toggleComplete(step.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Step Number/Check */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : "bg-primary/10 text-primary group-hover:scale-110"
                  }`}
                >
                  {step.completed ? <CheckCircle2 className="h-6 w-6" /> : index + 1}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                          {step.time}
                        </Badge>
                        {step.completed && (
                          <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      size="sm"
                      variant={step.completed ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(step.path);
                      }}
                      className="flex-shrink-0"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {step.completed ? "Review" : "Start"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next Steps */}
      {progress === 100 && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎓 Ready for Advanced Features?
            </CardTitle>
            <CardDescription>You've mastered the basics! Explore advanced capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between group" onClick={() => navigate("/online-consultation")}>
              <span>Online Consultations & Telemedicine</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" className="w-full justify-between group" onClick={() => navigate("/admin")}>
              <span>Advanced Administration & Settings</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" className="w-full justify-between group" onClick={() => navigate("/reports")}>
              <span>Analytics & Business Intelligence</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
