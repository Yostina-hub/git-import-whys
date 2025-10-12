import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface EMRNotesTabProps {
  patientId: string | null;
  onNoteCreated?: (patientId: string) => void;
}

const EMRNotesTab = ({ patientId, onNoteCreated }: EMRNotesTabProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: patientId || "",
    note_type: "subjective" as const,
    content: "",
  });

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    const [notesRes, patientsRes] = await Promise.all([
      supabase
        .from("emr_notes")
        .select("*, patients(first_name, last_name, mrn), profiles(first_name, last_name)")
        .order("created_at", { ascending: false })
        .then(res => patientId ? { ...res, data: res.data?.filter(n => n.patient_id === patientId) } : res),
      supabase.from("patients").select("*").order("first_name"),
    ]);

    if (notesRes.data) setNotes(notesRes.data);
    if (patientsRes.data) setPatients(patientsRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("emr_notes").insert([
      {
        ...formData,
        author_id: user?.id,
      },
    ]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating note",
        description: error.message,
      });
    } else {
      toast({
        title: "Note created",
        description: "The EMR note has been saved successfully.",
      });
      setIsDialogOpen(false);
      loadData();
      
      // Trigger consent dialog
      if (onNoteCreated && formData.patient_id) {
        onNoteCreated(formData.patient_id);
      }
      
      setFormData({
        patient_id: patientId || "",
        note_type: "subjective",
        content: "",
      });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>EMR Notes</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create EMR Note</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!patientId && (
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select value={formData.patient_id} onValueChange={(value) => setFormData({ ...formData, patient_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.mrn} - {p.first_name} {p.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Note Type *</Label>
                  <Select value={formData.note_type} onValueChange={(value: any) => setFormData({ ...formData, note_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subjective">Subjective</SelectItem>
                      <SelectItem value="objective">Objective</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="plan">Plan</SelectItem>
                      <SelectItem value="discharge">Discharge</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="message">Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Note Content *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter note content..."
                    rows={10}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Save Note"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold">
                    {note.patients?.mrn} - {note.patients?.first_name} {note.patients?.last_name}
                  </span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({note.note_type})
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(note.created_at).toLocaleString()}
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                By: {note.profiles?.first_name} {note.profiles?.last_name}
              </div>
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No EMR notes recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EMRNotesTab;
