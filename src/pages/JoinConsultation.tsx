import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { VideoCallInterface } from '@/components/consultation/VideoCallInterface';
import { ConsultationChat } from '@/components/consultation/ConsultationChat';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Video, Loader2, User, Phone } from 'lucide-react';

export default function JoinConsultation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const consultationId = searchParams.get('id');

  const [consultation, setConsultation] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  useEffect(() => {
    if (!consultationId) {
      toast({
        title: 'Invalid Link',
        description: 'No consultation ID provided',
        variant: 'destructive',
      });
      return;
    }

    loadConsultation();
  }, [consultationId]);

  const loadConsultation = async () => {
    try {
      const { data: consultationData, error: consultationError } = await supabase
        .from('online_consultations')
        .select('*, patients(*)')
        .eq('id', consultationId)
        .single();

      if (consultationError) throw consultationError;

      setConsultation(consultationData);
      setPatient(consultationData.patients);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error loading consultation:', error);
      toast({
        title: 'Error',
        description: 'This consultation link is invalid or expired',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const joinConsultation = () => {
    if (!patientName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name',
        variant: 'destructive',
      });
      return;
    }

    setHasJoined(true);
  };

  const handleEndCall = () => {
    toast({
      title: 'Consultation Ended',
      description: 'Thank you for joining',
    });
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Consultation</CardTitle>
            <CardDescription>This consultation link is not valid</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 w-fit">
              <Video className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Join Online Consultation</CardTitle>
            <CardDescription>
              {consultation.consultation_type === 'video' ? 'Video' : 
               consultation.consultation_type === 'audio' ? 'Audio' : 'Chat'} consultation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Before you join:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Make sure you're in a quiet environment</li>
                <li>• Check your camera and microphone</li>
                <li>• Have a stable internet connection</li>
              </ul>
            </div>

            <Button 
              onClick={joinConsultation} 
              className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-lg py-6"
            >
              <Video className="h-5 w-5 mr-2" />
              Join Consultation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <VideoCallInterface
        roomId={consultation.room_id}
        userId={"patient-" + consultationId}
        userName={patientName}
        onEndCall={handleEndCall}
        onOpenChat={() => setShowChat(true)}
        onOpenPrescription={() => {}}
        onOpenNotes={() => {}}
      />

      {/* Chat Sheet */}
      <Sheet open={showChat} onOpenChange={setShowChat}>
        <SheetContent side="right" className="w-full sm:w-[500px] p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Consultation Chat</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-80px)] p-6 pt-4">
            <ConsultationChat consultationId={consultationId!} senderType="patient" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
