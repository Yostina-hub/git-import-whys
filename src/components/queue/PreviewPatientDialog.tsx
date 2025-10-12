import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, FileText, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface PreviewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: any;
  onComplete: () => void;
}

export function PreviewPatientDialog({
  open,
  onOpenChange,
  ticket,
  onComplete,
}: PreviewPatientDialogProps) {
  const [triageInfo, setTriageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && ticket) {
      loadTriageInfo();
    }
  }, [open, ticket]);

  const loadTriageInfo = async () => {
    setLoading(true);
    try {
      // Find the triage ticket for this patient with the same token
      const { data: triageTicket, error: triageError } = await supabase
        .from("tickets")
        .select(`
          *,
          queues(name, queue_type),
          served_by_profile:profiles!tickets_served_by_fkey(first_name, last_name)
        `)
        .eq("patient_id", ticket.patient_id)
        .eq("token_number", ticket.token_number)
        .eq("status", "served")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (triageError) {
        console.error("Error loading triage info:", triageError);
      }

      // Get the latest EMR note for this patient
      const { data: emrNote, error: emrError } = await supabase
        .from("emr_notes")
        .select("content, note_type, created_at")
        .eq("patient_id", ticket.patient_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (emrError) {
        console.error("Error loading EMR note:", emrError);
      }

      setTriageInfo({
        triageTicket,
        emrNote,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Patient Preview - Token {ticket.token_number}
          </DialogTitle>
          <DialogDescription>
            Review patient details and triage information
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Patient Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {ticket.patients.first_name} {ticket.patients.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MRN</p>
                  <p className="font-medium">{ticket.patients.mrn}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">
                    {calculateAge(ticket.patients.date_of_birth)} years
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{ticket.patients.phone_mobile}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge variant={ticket.priority === 'stat' ? 'destructive' : 'secondary'}>
                    {ticket.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Triage Journey */}
            {triageInfo?.triageTicket && (
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  Patient Journey
                </h3>
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Came from</p>
                      <Badge variant="outline">{triageInfo.triageTicket.queues?.name || 'Triage'}</Badge>
                    </div>
                    {triageInfo.triageTicket.served_by_profile && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Assessed by</p>
                        <p className="font-medium">
                          {triageInfo.triageTicket.served_by_profile.first_name}{' '}
                          {triageInfo.triageTicket.served_by_profile.last_name}
                        </p>
                      </div>
                    )}
                    {triageInfo.triageTicket.served_at && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Triage completed</p>
                        <p className="font-medium">
                          {format(new Date(triageInfo.triageTicket.served_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    )}
                    {triageInfo.triageTicket.notes && (
                      <div className="mt-3 pt-3 border-t border-primary/20">
                        <p className="text-sm text-muted-foreground mb-1">Triage Notes</p>
                        <p className="text-sm">{triageInfo.triageTicket.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chief Complaint / EMR Note */}
            {triageInfo?.emrNote && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Chief Complaint</h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{triageInfo.emrNote.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(triageInfo.emrNote.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}

            {!triageInfo?.triageTicket && !triageInfo?.emrNote && (
              <div className="text-center py-6 text-muted-foreground">
                <p>No triage information available for this patient</p>
                <p className="text-sm mt-1">Patient may have been directly added to queue</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onComplete}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
