import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, Bot, User, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIGuideAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hello! I'm your intelligent guide assistant. I can help you with:\n\n• Step-by-step tutorials for any feature\n• Troubleshooting and problem-solving\n• Best practices and tips\n• Feature explanations\n• Workflow optimization\n\nWhat would you like to learn today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "How do I register a new patient?",
    "Show me how to create an invoice",
    "What are the best practices for queue management?",
    "How do I set up online consultations?",
    "Explain the reporting features",
    "How do I configure user roles?",
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (question?: string) => {
    const userMessage = question || input.trim();
    if (!userMessage) return;

    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke("clinical-analysis", {
        body: {
          messages: [...messages, newUserMessage],
          analysisType: "guide",
          context: {
            type: "user_guide",
            system: "EMR Healthcare System",
            modules: [
              "Patient Management",
              "Appointments",
              "Clinical Records",
              "Billing",
              "Queue Management",
              "Online Consultation",
              "Reports",
              "Administration",
            ],
          },
        },
      });

      if (response.error) throw response.error;

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.analysis || "I apologize, but I couldn't generate a response. Please try again.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Guide error:", error);
      toast.error("Failed to get AI response. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Chat Interface */}
      <Card className="lg:col-span-2 border-2">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>AI Guide Assistant</CardTitle>
              <CardDescription>Get instant help powered by artificial intelligence</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[600px]">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  <div
                    className={`flex-1 p-4 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-12"
                        : "bg-muted mr-12"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex-1 p-4 rounded-lg bg-muted mr-12">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything about the system..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Questions */}
      <Card className="border-2">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Suggested Questions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <ScrollArea className="h-[520px]">
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/5 hover:border-primary/50"
                  onClick={() => handleSend(question)}
                  disabled={isLoading}
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{question}</span>
                  </div>
                </Button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/20">
                  Pro Tip
                </Badge>
              </h4>
              <p className="text-sm text-muted-foreground">
                Ask detailed questions for better answers. For example: "How do I register a patient with insurance information?"
              </p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
