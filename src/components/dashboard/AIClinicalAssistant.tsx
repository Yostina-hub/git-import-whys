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
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-3 py-2 border-b bg-gradient-to-r from-primary to-primary/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <div>
                <SheetTitle className="text-white text-sm">AI Clinical Assistant</SheetTitle>
                <p className="text-[10px] text-white/80">Powered by SONIK Intelligence</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </SheetHeader>

        {/* Notice */}
        <div className="px-3 pt-2 pb-1">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-1.5">
              <div className="flex gap-1.5">
                <AlertTriangle className="h-3 w-3 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700">
                  AI suggestions are evidence-based. Always verify with clinical judgment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 py-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-2 py-1.5 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-xs">{message.content}</p>

                  {/* Clinical Suggestion Card */}
                  {message.type === "clinical-suggestion" && message.suggestion && (
                    <Card className="mt-1.5 border bg-background">
                      <CardContent className="p-2 space-y-1.5">
                        <div>
                          <Badge variant="outline" className="mb-1 text-[10px] h-4">DIAGNOSIS</Badge>
                          <h4 className="font-semibold text-xs">{message.suggestion.title}</h4>
                        </div>

                        {/* Confidence */}
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-medium">Confidence</span>
                            <span className="text-[10px] font-semibold">
                              {message.suggestion.confidence}% - {getConfidenceLabel(message.suggestion.confidence)}
                            </span>
                          </div>
                          <Progress value={message.suggestion.confidence} className="h-1" />
                        </div>

                        {/* Reasoning */}
                        <div>
                          <h5 className="text-[10px] font-semibold mb-0.5">Reasoning:</h5>
                          <p className="text-[10px] text-muted-foreground">{message.suggestion.reasoning}</p>
                        </div>

                        {/* Evidence */}
                        <div>
                          <h5 className="text-[10px] font-semibold mb-0.5">Evidence:</h5>
                          <ul className="space-y-0.5">
                            {message.suggestion.evidence.map((item, idx) => (
                              <li key={idx} className="text-[10px] text-muted-foreground flex gap-1">
                                <span className="text-blue-600">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 pt-0.5">
                          <Button size="sm" variant="default" className="flex-1 h-6 text-[10px]">
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 h-6 text-[10px]">
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
        <div className="border-t p-2 bg-background">
          <div className="flex gap-1.5">
            <Button variant="outline" size="icon" className="flex-shrink-0 h-7 w-7">
              <Mic className="h-3 w-3" />
            </Button>
            <Input
              placeholder="Type message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 h-7 text-xs"
            />
            <Button onClick={handleSend} size="icon" className="flex-shrink-0 h-7 w-7">
              <Send className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-1">
            AI responses are for informational purposes only
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

