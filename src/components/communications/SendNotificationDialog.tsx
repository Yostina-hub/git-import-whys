import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface SendNotificationDialogProps {
  onSent: () => void;
}

export const SendNotificationDialog = ({ onSent }: SendNotificationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    if (open) {
      loadPatients();
      loadTemplates();
    }
  }, [open]);

  const loadPatients = async () => {
    const { data } = await supabase
      .from("patients")
      .select("id, mrn, first_name, last_name, email, phone_mobile")
      .order("created_at", { ascending: false })
      .limit(100);
    setPatients(data || []);
  };

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("notification_templates" as any)
      .select("*")
      .eq("is_active", true);
    setTemplates(data as any || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast({
        variant: "destructive",
        title: "Missing patient",
        description: "Please select a patient",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const patient = patients.find((p) => p.id === selectedPatient);
      const template = templates.find((t) => t.id === selectedTemplate);

      let body = customMessage;
      let subject = null;

      if (template) {
        // Simple variable replacement
        body = template.body_template
          .replace(/{{patient_name}}/g, `${patient.first_name} ${patient.last_name}`)
          .replace(/{{clinic_name}}/g, "SONIK EMR");
        
        subject = template.subject?.replace(/{{patient_name}}/g, `${patient.first_name} ${patient.last_name}`);
      }

      // Log the notification (in a real system, this would trigger actual sending)
      const { error } = await supabase.from("notifications_log" as any).insert({
        recipient_type: "patient",
        recipient_id: selectedPatient,
        notification_type: template?.type || "internal",
        subject: subject,
        body: body,
        status: "sent", // In production, this would be "pending" until actually sent
        sent_at: new Date().toISOString(),
      } as any);

      if (error) throw error;

      toast({
        title: "Notification logged",
        description: "In production, this would send the actual notification",
      });

      setOpen(false);
      setSelectedPatient("");
      setSelectedTemplate("");
      setCustomMessage("");
      onSent();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Send Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Notification</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patient">Patient</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.mrn} - {patient.first_name} {patient.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="template">Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select template or write custom message" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedTemplate && (
            <div>
              <Label htmlFor="message">Custom Message</Label>
              <Textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={6}
                required={!selectedTemplate}
              />
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg text-sm">
            <strong>Note:</strong> This is a demo system. In production, this would integrate
            with email/SMS services to actually send notifications.
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
