import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddVitalSignDialog } from "@/components/clinical/AddVitalSignDialog";
import { AddAllergyDialog } from "@/components/clinical/AddAllergyDialog";
import { Button } from "@/components/ui/button";
import { Stethoscope, AlertTriangle, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TriageAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  ticketId: string;
  onComplete: () => void;
}

export function TriageAssessmentDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  ticketId,
  onComplete,
}: TriageAssessmentDialogProps) {
  const { toast } = useToast();
  const [showVitalsDialog, setShowVitalsDialog] = useState(false);
  const [showAllergyDialog, setShowAllergyDialog] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [triageNotes, setTriageNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCompleteAssessment = async () => {
    if (!chiefComplaint.trim()) {
      toast({
        variant: "destructive",
        title: "Chief complaint required",
        description: "Please enter the patient's chief complaint before completing triage.",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the current ticket to preserve the token number
      const { data: currentTicket, error: ticketFetchError } = await supabase
        .from("tickets")
        .select("token_number, priority")
        .eq("id", ticketId)
        .single();

      if (ticketFetchError) throw ticketFetchError;

      // Create EMR note for triage assessment
      const { error: noteError } = await supabase.from("emr_notes").insert([{
        patient_id: patientId,
        author_id: user.id,
        note_type: "subjective" as const,
        content: `**Chief Complaint:** ${chiefComplaint}\n\n**Triage Notes:**\n${triageNotes}`,
        tags: ["triage", "assessment"],
      }]);

      if (noteError) throw noteError;

      // Mark the current triage ticket as served
      const { error: ticketError } = await supabase
        .from("tickets")
        .update({ 
          status: "served", 
          served_at: new Date().toISOString(),
          served_by: user.id 
        })
        .eq("id", ticketId);

      if (ticketError) throw ticketError;

      // Find the doctor queue
      const { data: doctorQueue, error: queueError } = await supabase
        .from("queues")
        .select("id")
        .eq("queue_type", "doctor")
        .eq("is_active", true)
        .maybeSingle();

      if (queueError) throw queueError;
      if (!doctorQueue) throw new Error("No active doctor queue found");

      // Create new ticket in doctor queue with the SAME token number
      const { error: newTicketError } = await supabase
        .from("tickets")
        .insert({
          patient_id: patientId,
          queue_id: doctorQueue.id,
          token_number: currentTicket.token_number,
          status: "waiting",
          priority: currentTicket.priority,
          notes: `Transferred from triage. Chief complaint: ${chiefComplaint}`
        });

      if (newTicketError) throw newTicketError;

      toast({
        title: "Triage complete",
        description: `${patientName} transferred to doctor queue with token ${currentTicket.token_number}`,
      });

      setChiefComplaint("");
      setTriageNotes("");
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error completing assessment",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Triage Assessment - {patientName}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="vitals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vitals">
                <Stethoscope className="h-4 w-4 mr-2" />
                Vitals
              </TabsTrigger>
              <TabsTrigger value="allergies">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Allergies
              </TabsTrigger>
              <TabsTrigger value="assessment">
                <FileText className="h-4 w-4 mr-2" />
                Assessment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vitals" className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-4">
                  Record the patient's vital signs. This helps establish baseline health metrics.
                </p>
                <Button onClick={() => setShowVitalsDialog(true)} className="w-full">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Record Vital Signs
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="allergies" className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-4">
                  Document any known allergies to medications, foods, or other substances.
                </p>
                <Button onClick={() => setShowAllergyDialog(true)} className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Add Allergy
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="assessment" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
                  <Textarea
                    id="chiefComplaint"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="What is the patient's main reason for visit? (e.g., Chest pain for 2 hours, Fever and cough for 3 days)"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="triageNotes">Triage Notes</Label>
                  <Textarea
                    id="triageNotes"
                    value={triageNotes}
                    onChange={(e) => setTriageNotes(e.target.value)}
                    placeholder="Initial assessment, observations, patient condition, urgency level..."
                    rows={6}
                  />
                </div>

                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <p className="text-sm font-medium mb-2">Next Steps:</p>
                  <p className="text-sm text-muted-foreground">
                    After completing this assessment, the patient will need to be routed to the appropriate department (Doctor, Lab, etc.) from the queue management screen.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteAssessment} disabled={loading}>
              {loading ? "Completing..." : "Complete Assessment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddVitalSignDialog
        open={showVitalsDialog}
        onOpenChange={setShowVitalsDialog}
        patientId={patientId}
        onSuccess={() => {
          toast({
            title: "Vital signs recorded",
            description: "Patient vitals have been saved successfully",
          });
        }}
      />

      <AddAllergyDialog
        open={showAllergyDialog}
        onOpenChange={setShowAllergyDialog}
        patientId={patientId}
        onSuccess={() => {
          toast({
            title: "Allergy recorded",
            description: "Patient allergy has been saved successfully",
          });
        }}
      />
    </>
  );
}
