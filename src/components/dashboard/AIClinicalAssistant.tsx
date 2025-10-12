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
        <SheetHeader className="px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-cyan-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-white text-base">AI Clinical Assistant</SheetTitle>
                <p className="text-xs text-white/80">Online</p>
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

        {/* Chat Messages */}
        <ScrollArea className="flex-1 bg-muted/30">
          <div className="space-y-4 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex flex-col max-w-[80%]">
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white border border-border rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>

                  {/* Clinical Suggestion Card */}
                  {message.type === "clinical-suggestion" && message.suggestion && (
                    <div className="mt-2 rounded-xl bg-white border-2 border-blue-200 p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs mb-1">DIAGNOSIS</Badge>
                          <h4 className="font-semibold text-sm">{message.suggestion.title}</h4>
                        </div>
                      </div>

                      {/* Confidence */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Confidence</span>
                          <span className="text-xs font-semibold text-green-600">
                            {message.suggestion.confidence}%
                          </span>
                        </div>
                        <Progress value={message.suggestion.confidence} className="h-1.5" />
                      </div>

                      {/* Reasoning */}
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Reasoning: </span>
                        {message.suggestion.reasoning}
                      </div>

                      {/* Evidence */}
                      <ul className="space-y-1">
                        {message.suggestion.evidence.map((item, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex gap-1.5">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="flex-1 h-8 text-xs">
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}

                  <span className="text-xs text-muted-foreground mt-1 px-2">
                    {message.role === "assistant" ? "Just now" : "Sent"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-background p-3">
          <div className="flex gap-2 items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex-shrink-0 h-9 w-9 rounded-full"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 rounded-full border-muted-foreground/20"
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              className="flex-shrink-0 h-9 w-9 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

