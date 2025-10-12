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
      <SheetContent side="right" className="w-[350px] p-0 flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 border-l-0">
        {/* Modern Header */}
        <div className="px-4 py-3 border-b border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Voice Assistant</h3>
                <p className="text-xs text-muted-foreground">Ready to help</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Modern Status Indicator */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening 
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-2xl shadow-blue-500/40 scale-105' 
                  : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800'
              }`}>
                <Mic className={`h-10 w-10 transition-all duration-300 ${
                  isListening ? 'text-white animate-pulse' : 'text-slate-600 dark:text-slate-300'
                }`} />
              </div>
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
              )}
            </div>
            <Badge 
              variant={isListening ? "default" : "secondary"} 
              className={`px-4 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                isListening 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30' 
                  : ''
              }`}
            >
              {isListening ? "🎤 Listening..." : "Ready to assist"}
            </Badge>
          </div>

          {/* Modern Quick Commands */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Quick Commands
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_COMMANDS.map((cmd) => (
                <button
                  key={cmd.action}
                  onClick={() => handleCommand(cmd.label)}
                  className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 border border-border/50 p-3 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-blue-500/50 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <p className="text-xs font-medium relative z-10">{cmd.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Example Hints */}
          <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30 p-3">
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              Try: <span className="text-blue-600 dark:text-blue-400 font-medium">"Show patient John Smith"</span>
            </p>
          </div>
        </div>

        {/* Modern Action Area */}
        <div className="p-4 border-t border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl space-y-3">
          <Button
            onClick={toggleListening}
            className={`w-full h-11 rounded-xl font-medium transition-all duration-200 shadow-lg ${
              isListening
                ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-500/30'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/30'
            }`}
          >
            {isListening ? "Stop Listening" : "Click to Speak"}
          </Button>
          
          <Button 
            variant="link" 
            className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            View All Commands →
          </Button>
        </div>

        {/* Floating Mute Button */}
        <div className="absolute bottom-20 right-4">
          <Button
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className={`h-12 w-12 rounded-full shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 ${
              isMuted 
                ? 'bg-gradient-to-br from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-500/40' 
                : 'bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black shadow-slate-900/40'
            }`}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
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
