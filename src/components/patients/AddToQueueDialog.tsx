import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ListPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AddToQueueDialogProps {
  patientId: string;
  patientName: string;
  isReturning?: boolean;
  onSuccess?: () => void;
}

export function AddToQueueDialog({ patientId, patientName, isReturning = false, onSuccess }: AddToQueueDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [queues, setQueues] = useState<any[]>([]);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [priority, setPriority] = useState<"routine" | "stat" | "vip">("routine");
  const [notes, setNotes] = useState("");
  const [visitHistory, setVisitHistory] = useState<any>(null);

  useEffect(() => {
    if (open) {
      loadQueues();
      checkVisitHistory();
    }
  }, [open]);

  const checkVisitHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, scheduled_start, status")
        .eq("patient_id", patientId)
        .order("scheduled_start", { ascending: false })
        .limit(1);

      if (error) throw error;

      setVisitHistory(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error("Error checking visit history:", error);
    }
  };

  const loadQueues = async () => {
    const { data, error } = await supabase
      .from("queues")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading queues",
        description: error.message,
      });
    } else {
      setQueues(data || []);
      // Default to Triage queue for initial patient flow
      const triageQueue = data?.find(q => q.queue_type === 'triage');
      if (triageQueue) {
        setSelectedQueue(triageQueue.id);
      } else if (data && data.length > 0) {
        setSelectedQueue(data[0].id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check payment status before adding to triage or doctor queue
      const selectedQueueData = queues.find(q => q.id === selectedQueue);
      if (selectedQueueData && (selectedQueueData.queue_type === 'triage' || selectedQueueData.queue_type === 'doctor')) {
        // Check if patient is returning
        const hasVisitHistory = visitHistory !== null;
        
        const { data: invoices, error: invoiceError } = await supabase
          .from("invoices")
          .select("status, lines")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (invoiceError) throw invoiceError;

        if (!invoices || invoices.length === 0) {
          const message = hasVisitHistory 
            ? "Returning patient needs a consultation fee invoice. Registration fee is waived for returning patients."
            : "New patient must have a paid invoice (including registration fee) before proceeding to triage or doctor queue.";
          
          toast({
            variant: "destructive",
            title: "Payment Required",
            description: message,
          });
          setLoading(false);
          return;
        }

        if (invoices[0].status !== 'paid') {
          toast({
            variant: "destructive",
            title: "Payment Not Complete",
            description: `Patient invoice status is "${invoices[0].status}". Only patients with paid invoices can proceed to triage or doctor queue.`,
          });
          setLoading(false);
          return;
        }
      }

      // Generate token number
      const { data: tokenData } = await supabase.rpc("generate_ticket_token", {
        queue_prefix: "Q"
      });
      const tokenNumber = tokenData || `Q${Date.now()}`;

      // Create ticket
      const { error } = await supabase
        .from("tickets")
        .insert([{
          queue_id: selectedQueue,
          patient_id: patientId,
          token_number: tokenNumber,
          status: "waiting",
          priority: priority,
          notes: notes || null,
        }]);

      if (error) throw error;

      toast({
        title: "Added to queue",
        description: `${patientName} added to queue with token ${tokenNumber}`,
      });

      setOpen(false);
      setNotes("");
      setPriority("routine");
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding to queue",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <ListPlus className="h-4 w-4 mr-2" />
          Add to Queue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Patient to Queue</DialogTitle>
        </DialogHeader>
        
        {isReturning || visitHistory ? (
          <Alert className="bg-green-50 border-green-300">
            <Info className="h-4 w-4 text-green-700" />
            <AlertDescription className="text-green-700">
              <strong>Returning Patient</strong> - Registration fee waived. Only consultation fee required.
              {visitHistory && (
                <div className="text-xs mt-1">
                  Last visit: {new Date(visitHistory.scheduled_start).toLocaleDateString()}
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>New Patient</strong> - Patients should start in Triage Queue for initial assessment. Registration fee + consultation fee required.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Patient</Label>
            <div className="text-sm font-medium">{patientName}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="queue">Select Queue *</Label>
            <Select value={selectedQueue} onValueChange={setSelectedQueue} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a queue" />
              </SelectTrigger>
              <SelectContent>
                {queues.map((queue) => (
                  <SelectItem key={queue.id} value={queue.id}>
                    {queue.name} ({queue.queue_type})
                    {queue.queue_type === 'triage' && ' - Recommended First'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="stat">STAT</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special notes or requirements..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !selectedQueue}>
            {loading ? "Adding..." : "Add to Queue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}