import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";

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
  const [editingNote, setEditingNote] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    patient_id: patientId || "",
    note_type: "subjective" as const,
    content: "",
  });

  useEffect(() => {
    loadData();
    getCurrentUser();
  }, [patientId, currentPage, pageSize]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get total count
    let countQuery = supabase
      .from("emr_notes")
      .select("*", { count: "exact", head: true });

    if (patientId) {
      countQuery = countQuery.eq("patient_id", patientId);
    }

    const { count } = await countQuery;
    setTotalCount(count || 0);

    // Get paginated data
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("emr_notes")
      .select("*, patients(first_name, last_name, mrn)")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const [notesRes, patientsRes, profilesRes] = await Promise.all([
      query,
      supabase.from("patients").select("*").order("first_name"),
      supabase.from("profiles").select("id, first_name, last_name"),
    ]);

    // Merge author data manually
    const notesWithAuthors = notesRes.data?.map(note => ({
      ...note,
      author: profilesRes.data?.find(p => p.id === note.author_id)
    })) || [];

    setNotes(notesWithAuthors);
    if (patientsRes.data) setPatients(patientsRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (editingNote) {
      // Update existing note
      const { error } = await supabase
        .from("emr_notes")
        .update({
          note_type: formData.note_type,
          content: formData.content,
        })
        .eq("id", editingNote.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error updating note",
          description: error.message,
        });
      } else {
        toast({
          title: "Note updated",
          description: "The EMR note has been updated successfully.",
        });
        setIsDialogOpen(false);
        setEditingNote(null);
        loadData();
      }
    } else {
      // Create new note
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
    }
    setLoading(false);
  };

  const canEditNote = (note: any) => {
    if (!currentUserId || note.author_id !== currentUserId) return false;
    
    const createdAt = new Date(note.created_at);
    const now = new Date();
    const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    
    return diffInMinutes <= 5;
  };

  const handleEditNote = (note: any) => {
    setEditingNote(note);
    setFormData({
      patient_id: note.patient_id,
      note_type: note.note_type,
      content: note.content,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingNote(null);
      setFormData({
        patient_id: patientId || "",
        note_type: "subjective",
        content: "",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>EMR Notes</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingNote ? "Edit EMR Note" : "Create EMR Note"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!patientId && !editingNote && (
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
                  {loading ? "Saving..." : editingNote ? "Update Note" : "Save Note"}
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
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {new Date(note.created_at).toLocaleString()}
                  </div>
                  {canEditNote(note) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                By: {note.author?.first_name} {note.author?.last_name}
              </div>
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No EMR notes recorded yet.
          </div>
        )}

        {notes.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / pageSize)}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default EMRNotesTab;
