import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Video, Phone, MessageSquare, Calendar } from 'lucide-react';

interface StartConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
}

export function StartConsultationDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
}: StartConsultationDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [consultationType, setConsultationType] = useState<'video' | 'audio' | 'chat'>('video');
  const [duration, setDuration] = useState('30');
  const [isStarting, setIsStarting] = useState(false);

  const startConsultation = async () => {
    setIsStarting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in',
        variant: 'destructive',
      });
      setIsStarting(false);
      return;
    }

    try {
      const now = new Date();
      const scheduledEnd = new Date(now.getTime() + parseInt(duration) * 60000);
      const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const { data, error } = await supabase
        .from('online_consultations')
        .insert([{
          patient_id: patientId,
          doctor_id: user.id,
          consultation_type: consultationType,
          status: 'active',
          scheduled_start: now.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          actual_start: now.toISOString(),
          room_id: roomId,
          recording_consent: false,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Consultation Started',
        description: `${consultationType.charAt(0).toUpperCase() + consultationType.slice(1)} consultation with ${patientName}`,
      });

      // Navigate to consultation page
      navigate(`/online-consultation?id=${data.id}`);
    } catch (error: any) {
      console.error('Error starting consultation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start consultation',
        variant: 'destructive',
      });
    }

    setIsStarting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start Online Consultation</DialogTitle>
          <DialogDescription>
            Configure and start a consultation with {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Consultation Type */}
          <div className="space-y-3">
            <Label>Consultation Type</Label>
            <RadioGroup value={consultationType} onValueChange={(v: any) => setConsultationType(v)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Video Call</div>
                    <div className="text-xs text-muted-foreground">
                      Face-to-face video consultation
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="audio" id="audio" />
                <Label htmlFor="audio" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Audio Call</div>
                    <div className="text-xs text-muted-foreground">Voice-only consultation</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="chat" id="chat" />
                <Label htmlFor="chat" className="flex-1 cursor-pointer flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Chat Only</div>
                    <div className="text-xs text-muted-foreground">Text-based consultation</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Expected Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expected Duration (minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="5"
              max="120"
              placeholder="30"
            />
          </div>

          {/* Start Button */}
          <Button
            onClick={startConsultation}
            disabled={isStarting}
            className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
            size="lg"
          >
            {isStarting ? (
              'Starting...'
            ) : (
              <>
                {consultationType === 'video' && <Video className="h-5 w-5" />}
                {consultationType === 'audio' && <Phone className="h-5 w-5" />}
                {consultationType === 'chat' && <MessageSquare className="h-5 w-5" />}
                Start Consultation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
