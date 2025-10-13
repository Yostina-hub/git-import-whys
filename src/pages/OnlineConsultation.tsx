import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { VideoCallInterface } from '@/components/consultation/VideoCallInterface';
import { ConsultationChat } from '@/components/consultation/ConsultationChat';
import { EPrescriptionForm } from '@/components/consultation/EPrescriptionForm';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, FileText, Save, Copy, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OnlineConsultation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const consultationId = searchParams.get('id');

  const [consultation, setConsultation] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (!consultationId) {
      toast({
        title: 'Error',
        description: 'No consultation ID provided',
        variant: 'destructive',
      });
      navigate('/doctor-queue');
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

      // Update consultation status to active
      if (consultationData.status === 'scheduled' || consultationData.status === 'waiting') {
        await supabase
          .from('online_consultations')
          .update({
            status: 'active',
            actual_start: new Date().toISOString(),
          })
          .eq('id', consultationId);
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error('Error loading consultation:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/doctor-queue');
    }
  };

  const handleEndCall = async () => {
    try {
      // Update consultation status
      await supabase
        .from('online_consultations')
        .update({
          status: 'completed',
          actual_end: new Date().toISOString(),
        })
        .eq('id', consultationId);

      // Generate AI summary
      try {
        await supabase.functions.invoke('generate-consultation-summary', {
          body: { consultationId },
        });
      } catch (summaryError) {
        console.error('Error generating summary:', summaryError);
      }

      toast({
        title: 'Consultation Ended',
        description: 'The consultation has been completed successfully',
      });

      navigate('/doctor-queue');
    } catch (error: any) {
      console.error('Error ending call:', error);
      toast({
        title: 'Error',
        description: 'Failed to end consultation',
        variant: 'destructive',
      });
    }
  };

  const saveNotes = async () => {
    if (!clinicalNotes.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter some notes',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingNotes(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      // Save as EMR note
      const { error } = await supabase.from('emr_notes').insert({
        patient_id: patient.id,
        author_id: user.id,
        note_type: 'subjective',
        content: clinicalNotes,
        tags: ['online-consultation'],
      });

      if (error) throw error;

      // Also update consultation metadata
      await supabase
        .from('online_consultations')
        .update({
          session_metadata: {
            ...consultation.session_metadata,
            clinical_notes: clinicalNotes,
          },
        })
        .eq('id', consultationId);

      toast({
        title: 'Notes Saved',
        description: 'Clinical notes have been saved successfully',
      });

      setClinicalNotes('');
      setShowNotes(false);
    } catch (error: any) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    }

    setIsSavingNotes(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (!consultation || !patient) {
    return null;
  }

  const copyJoinLink = () => {
    const joinUrl = `${window.location.origin}/join-consultation?id=${consultationId}`;
    navigator.clipboard.writeText(joinUrl);
    toast({
      title: 'Link Copied!',
      description: 'Share this link with the patient to join',
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Patient Info and Join Link */}
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
            Live Consultation
          </Badge>
          <span className="text-sm font-medium">{patient.first_name} {patient.last_name}</span>
          <span className="text-sm text-muted-foreground">MRN: {patient.mrn}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={copyJoinLink}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Patient Link
          </Button>
        </div>
      </div>

      {/* Video Call Interface */}
      <VideoCallInterface
        roomId={consultation.room_id}
        userId={consultation.doctor_id}
        userName={"Dr. " + patient.first_name}
        onEndCall={handleEndCall}
        onOpenChat={() => setShowChat(true)}
        onOpenPrescription={() => setShowPrescription(true)}
        onOpenNotes={() => setShowNotes(true)}
      />

      {/* Chat Sheet */}
      <Sheet open={showChat} onOpenChange={setShowChat}>
        <SheetContent side="right" className="w-full sm:w-[500px] p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Consultation Chat</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-80px)] p-6 pt-4">
            <ConsultationChat consultationId={consultationId!} senderType="doctor" />
          </div>
        </SheetContent>
      </Sheet>

      {/* Prescription Sheet */}
      <Sheet open={showPrescription} onOpenChange={setShowPrescription}>
        <SheetContent side="right" className="w-full sm:w-[600px] p-0 overflow-auto">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>E-Prescription</SheetTitle>
          </SheetHeader>
          <div className="p-6 pt-4">
            <EPrescriptionForm
              consultationId={consultationId!}
              patientId={patient.id}
              onSaved={() => {
                toast({
                  title: 'Success',
                  description: 'Prescription saved successfully',
                });
                setShowPrescription(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Clinical Notes Sheet */}
      <Sheet open={showNotes} onOpenChange={setShowNotes}>
        <SheetContent side="right" className="w-full sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Clinical Notes</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Enter your clinical notes for this consultation
              </label>
              <Textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Document the consultation findings, diagnosis, treatment plan, and follow-up recommendations..."
                rows={15}
                className="font-mono"
              />
            </div>
            <Button onClick={saveNotes} disabled={isSavingNotes} className="w-full gap-2">
              <Save className="h-4 w-4" />
              {isSavingNotes ? 'Saving...' : 'Save Clinical Notes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
