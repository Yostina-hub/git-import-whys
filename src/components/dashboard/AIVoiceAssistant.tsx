import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIVoiceAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAMPLE_COMMANDS = [
  { label: "View Dashboard", action: "dashboard" },
  { label: "View Patients", action: "patients" },
  { label: "New Appointment", action: "appointment" },
  { label: "Lab Results", action: "labs" },
];

export function AIVoiceAssistant({ open, onOpenChange }: AIVoiceAssistantProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const toggleListening = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      toast({
        title: "Voice Assistant Activated",
        description: "Listening for your command...",
      });
    }
  };

  const handleCommand = (command: string) => {
    toast({
      title: "Command Recognized",
      description: `Executing: ${command}`,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] p-0 flex flex-col bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-950 dark:to-slate-900/80 border-l-0 shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-tight">AI Voice Assistant</h3>
                <p className="text-xs text-muted-foreground">Powered by Zemar AI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg hover:bg-muted/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-8 space-y-8">
          {/* Status Indicator */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className={`h-28 w-28 rounded-full flex items-center justify-center transition-all duration-500 ${
                isListening 
                  ? 'bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-2xl shadow-blue-500/50 scale-105' 
                  : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-lg'
              }`}>
                <Mic className={`h-12 w-12 transition-all duration-300 ${
                  isListening ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                }`} />
              </div>
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" />
                  <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-pulse" />
                </>
              )}
            </div>
            <div className="text-center">
              <Badge 
                variant={isListening ? "default" : "secondary"} 
                className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  isListening 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/40 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isListening ? "🎤 Listening..." : "Ready"}
              </Badge>
              {isListening && (
                <p className="text-xs text-muted-foreground mt-2 animate-fade-in">
                  Speak now...
                </p>
              )}
            </div>
          </div>

          {/* Quick Commands */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">
              Quick Commands
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {SAMPLE_COMMANDS.map((cmd) => (
                <button
                  key={cmd.action}
                  onClick={() => handleCommand(cmd.label)}
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 p-3.5 text-left transition-all duration-300 hover:shadow-xl hover:scale-[1.03] hover:border-blue-400/60 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 relative z-10 leading-tight">
                    {cmd.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Example Hints */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/40 dark:border-blue-800/40 p-4 backdrop-blur-sm">
            <p className="text-xs text-center text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-medium text-slate-700 dark:text-slate-200">Try saying:</span>
              <br />
              <span className="text-blue-600 dark:text-blue-400 font-semibold">"Show patient John Smith"</span>
              <br />or <span className="text-blue-600 dark:text-blue-400 font-semibold">"Create appointment"</span>
            </p>
          </div>
        </div>

        {/* Action Area */}
        <div className="p-5 border-t border-border/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl space-y-3">
          <Button
            onClick={toggleListening}
            className={`w-full h-12 rounded-2xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.98] ${
              isListening
                ? 'bg-gradient-to-r from-red-500 via-red-600 to-pink-500 hover:from-red-600 hover:via-red-700 hover:to-pink-600 shadow-red-500/40 text-white'
                : 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 shadow-blue-500/40 text-white'
            }`}
          >
            {isListening ? "Stop Listening" : "Click to Speak"}
          </Button>
          
          <button 
            className="w-full text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1"
          >
            View All Commands →
          </button>
        </div>
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Voice Assistant
          </SheetTitle>
        </SheetHeader>

        <div className="py-8 space-y-8">
          {/* Status */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className={`h-24 w-24 rounded-full flex items-center justify-center ${
                isListening ? 'bg-primary/20 animate-pulse' : 'bg-muted'
              }`}>
                <Mic className={`h-12 w-12 ${isListening ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
            </div>
            <div>
              <Badge variant={isListening ? "default" : "secondary"} className="text-lg px-4 py-1">
                {isListening ? "Listening..." : "Ready"}
              </Badge>
            </div>
          </div>

          {/* Commands */}
          <div className="space-y-3">
            <h3 className="font-semibold text-center">Quick Commands:</h3>
            <div className="grid grid-cols-2 gap-3">
              {SAMPLE_COMMANDS.map((cmd) => (
                <Button
                  key={cmd.action}
                  variant="outline"
                  onClick={() => handleCommand(cmd.label)}
                  className="h-auto py-4"
                >
                  {cmd.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Example Commands */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Try saying: <span className="text-primary font-medium">"Show patient John Smith"</span> or{" "}
              <span className="text-primary font-medium">"Create appointment"</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              onClick={toggleListening}
              className="gap-2 min-w-[200px] bg-slate-700 hover:bg-slate-800 text-white"
              variant={isListening ? "destructive" : "default"}
            >
              {isListening ? "Stop Listening" : "Click to speak"}
            </Button>
            <Button 
              variant="link" 
              className="text-primary font-medium"
            >
              View All
            </Button>
          </div>
        </div>

        {/* Floating Status Button */}
        <div className="absolute bottom-6 right-6">
          <div className="relative">
            <Button
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className={`h-20 w-20 rounded-full ${
                isMuted 
                  ? 'bg-red-400 hover:bg-red-500' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>
            {isListening && (
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                <p className="text-sm font-medium text-green-600">completed</p>
                <p className="text-xs text-muted-foreground">10 min ago</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
