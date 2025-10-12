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
      <SheetContent side="bottom" className="h-[600px]">
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
          <div className="flex gap-3 justify-center">
            <Button
              size="lg"
              onClick={toggleListening}
              className="gap-2"
              variant={isListening ? "destructive" : "default"}
            >
              <Mic className="h-5 w-5" />
              {isListening ? "Stop Listening" : "Click to speak"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsMuted(!isMuted)}
              className="gap-2"
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {isMuted ? "Unmute" : "Mute"}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-muted/30 p-4">
          <p className="text-xs text-center text-muted-foreground">
            Voice commands are processed securely. Your privacy is protected.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
