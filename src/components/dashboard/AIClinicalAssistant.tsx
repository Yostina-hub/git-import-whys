import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, X, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ClinicalSuggestion {
  id: string;
  type: "diagnosis" | "medication" | "test";
  title: string;
  confidence: number;
  reasoning: string;
  evidence: string[];
}

interface AIClinicalAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIClinicalAssistant({ open, onOpenChange }: AIClinicalAssistantProps) {
  const [suggestions] = useState<ClinicalSuggestion[]>([
    {
      id: "1",
      type: "diagnosis",
      title: "Hypertension - Stage 1",
      confidence: 85,
      reasoning: "Blood pressure reading indicates elevated systolic pressure",
      evidence: ["Systolic BP: 145 mmHg (Normal: <120)"],
    },
    {
      id: "2",
      type: "medication",
      title: "Consider ACE Inhibitor (e.g., Lisinopril 10mg daily)",
      confidence: 70,
      reasoning: "First-line treatment for hypertension in patients without contraindications",
      evidence: [
        "Patient age: 45 years",
        "No history of angioedema",
        "Normal kidney function (eGFR: 95 mL/min/1.73m²)",
      ],
    },
  ]);

  const activeSuggestions = suggestions.length;
  const avgConfidence = Math.round(
    suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length
  );

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-blue-600";
    return "text-orange-600";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "High";
    if (confidence >= 60) return "Moderate";
    return "Low";
  };

  const getTypeIcon = (type: ClinicalSuggestion["type"]) => {
    switch (type) {
      case "diagnosis":
        return <AlertTriangle className="h-5 w-5 text-blue-600" />;
      case "medication":
        return <Sparkles className="h-5 w-5 text-green-600" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl text-white">AI Clinical Assistant</DialogTitle>
                  <p className="text-sm text-white/90 mt-1">Powered by SONIK Intelligence</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Clinical Decision Support Notice */}
        <div className="px-6 pt-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-blue-900">Clinical Decision Support</h4>
                  <p className="text-sm text-blue-700">
                    AI-generated suggestions based on evidence-based guidelines. Always verify with
                    clinical judgment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  {getTypeIcon(suggestion.type)}
                  <div className="flex-1 space-y-3">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {suggestion.type.toUpperCase()}
                      </Badge>
                      <h3 className="text-lg font-semibold">{suggestion.title}</h3>
                    </div>

                    {/* Confidence Level */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Confidence Level</span>
                        <span className={`text-sm font-semibold ${getConfidenceColor(suggestion.confidence)}`}>
                          {suggestion.confidence}% - {getConfidenceLabel(suggestion.confidence)}
                        </span>
                      </div>
                      <Progress 
                        value={suggestion.confidence} 
                        className="h-2"
                      />
                    </div>

                    {/* Reasoning */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Reasoning:</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                    </div>

                    {/* Evidence */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Evidence:</h4>
                      <ul className="space-y-1">
                        {suggestion.evidence.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1 gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2">
                        <ThumbsDown className="h-4 w-4" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="border-t bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{activeSuggestions}</div>
              <div className="text-sm text-muted-foreground">Active Suggestions</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{avgConfidence}%</div>
              <div className="text-sm text-muted-foreground">Avg. Confidence</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
