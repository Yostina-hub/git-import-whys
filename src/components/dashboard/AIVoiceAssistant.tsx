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
      <SheetContent side="bottom" className="h-auto max-h-[400px]">
        <SheetHeader className="border-b pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Voice Assistant
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {/* Status */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                isListening ? 'bg-primary/20 animate-pulse' : 'bg-muted'
              }`}>
                <Mic className={`h-6 w-6 ${isListening ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
            </div>
            <div>
              <Badge variant={isListening ? "default" : "secondary"} className="text-xs px-2 py-0.5">
                {isListening ? "Listening..." : "Ready"}
              </Badge>
            </div>
          </div>

          {/* Commands */}
          <div className="space-y-2">
            <h3 className="font-semibold text-center text-xs">Quick Commands:</h3>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_COMMANDS.map((cmd) => (
                <Button
                  key={cmd.action}
                  variant="outline"
                  onClick={() => handleCommand(cmd.label)}
                  className="h-auto py-2 text-xs"
                >
                  {cmd.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Example Commands */}
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">
              Try: <span className="text-primary font-medium">"Show patient John Smith"</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              onClick={toggleListening}
              className="gap-1.5 h-8 text-xs"
              variant={isListening ? "destructive" : "default"}
            >
              <Mic className="h-3 w-3" />
              {isListening ? "Stop" : "Speak"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsMuted(!isMuted)}
              className="gap-1.5 h-8 text-xs"
            >
              {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              {isMuted ? "Unmute" : "Mute"}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-2">
          <p className="text-[10px] text-center text-muted-foreground">
            Voice commands are processed securely.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
