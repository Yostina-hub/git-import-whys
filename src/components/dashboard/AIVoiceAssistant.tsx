import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Sparkles } from "lucide-react";
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
      <SheetContent side="right" className="w-[350px] p-0 flex flex-col">
        <SheetHeader className="border-b pb-3">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Voice Assistant
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Status */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
                isListening ? 'bg-primary/20 animate-pulse' : 'bg-muted'
              }`}>
                <Mic className={`h-10 w-10 ${isListening ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
            </div>
            <div>
              <Badge variant={isListening ? "default" : "secondary"} className="text-base px-3 py-1">
                {isListening ? "Listening..." : "Ready"}
              </Badge>
            </div>
          </div>

          {/* Commands */}
          <div className="space-y-2">
            <h3 className="font-semibold text-center text-sm">Quick Commands:</h3>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_COMMANDS.map((cmd) => (
                <Button
                  key={cmd.action}
                  variant="outline"
                  onClick={() => handleCommand(cmd.label)}
                  className="h-auto py-3 text-sm"
                >
                  {cmd.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Example Commands */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Try saying: <span className="text-primary font-medium">"Show patient John Smith"</span> or{" "}
              <span className="text-primary font-medium">"Create appointment"</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-2">
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
              className="text-primary font-medium text-sm"
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
              className={`h-16 w-16 rounded-full ${
                isMuted 
                  ? 'bg-red-400 hover:bg-red-500' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </Button>
            {isListening && (
              <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                <p className="text-xs font-medium text-green-600">completed</p>
                <p className="text-xs text-muted-foreground">10 min ago</p>
              </div>
            )}
          </div>
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
