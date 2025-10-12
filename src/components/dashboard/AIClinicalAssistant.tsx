import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, X, Mic, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AIClinicalAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "clinical-suggestion";
  suggestion?: {
    title: string;
    confidence: number;
    reasoning: string;
    evidence: string[];
  };
}

export function AIClinicalAssistant({ open, onOpenChange }: AIClinicalAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI Clinical Assistant. I can help you with clinical decision support, diagnostic suggestions, and evidence-based recommendations. How can I assist you today?",
    },
    {
      id: "2",
      role: "user",
      content: "Patient has BP reading of 145/95 mmHg, age 45, no previous history",
    },
    {
      id: "3",
      role: "assistant",
      content: "Based on the blood pressure reading, I have identified a potential diagnosis:",
      type: "clinical-suggestion",
      suggestion: {
        title: "Hypertension - Stage 1",
        confidence: 85,
        reasoning: "Blood pressure reading indicates elevated systolic pressure",
        evidence: [
          "Systolic BP: 145 mmHg (Normal: <120)",
          "Patient age: 45 years",
          "No previous cardiovascular history",
        ],
      },
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages([...messages, newMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm analyzing the information you provided. Let me check the latest clinical guidelines...",
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-blue-500";
    return "bg-orange-500";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "High";
    if (confidence >= 60) return "Moderate";
    return "Low";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-cyan-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <SheetTitle className="text-white text-base">AI Clinical Assistant</SheetTitle>
                <p className="text-xs text-white/90">Powered by SONIK Intelligence</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Notice */}
        <div className="px-4 pt-3 pb-2">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-2.5">
              <div className="flex gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  AI suggestions are based on evidence-based guidelines. Always verify with clinical judgment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>

                  {/* Clinical Suggestion Card */}
                  {message.type === "clinical-suggestion" && message.suggestion && (
                    <Card className="mt-3 border bg-background">
                      <CardContent className="p-3 space-y-2.5">
                        <div>
                          <Badge variant="outline" className="mb-1.5 text-xs">DIAGNOSIS</Badge>
                          <h4 className="font-semibold text-sm">{message.suggestion.title}</h4>
                        </div>

                        {/* Confidence */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Confidence Level</span>
                            <span className="text-xs font-semibold">
                              {message.suggestion.confidence}% - {getConfidenceLabel(message.suggestion.confidence)}
                            </span>
                          </div>
                          <Progress value={message.suggestion.confidence} className="h-1.5" />
                        </div>

                        {/* Reasoning */}
                        <div>
                          <h5 className="text-xs font-semibold mb-1">Reasoning:</h5>
                          <p className="text-xs text-muted-foreground">{message.suggestion.reasoning}</p>
                        </div>

                        {/* Evidence */}
                        <div>
                          <h5 className="text-xs font-semibold mb-1">Evidence:</h5>
                          <ul className="space-y-0.5">
                            {message.suggestion.evidence.map((item, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex gap-1.5">
                                <span className="text-blue-600">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="default" className="flex-1 h-7 text-xs">
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
                            Dismiss
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-3 bg-background">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Mic className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type your message or patient info..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon" className="flex-shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            AI responses are for informational purposes only
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

