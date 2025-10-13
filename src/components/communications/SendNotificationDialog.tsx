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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Users, UserCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface SendNotificationDialogProps {
  onSent: () => void;
}

export const SendNotificationDialog = ({ onSent }: SendNotificationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [recipientType, setRecipientType] = useState<"user" | "role" | "patient">("patient");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [notificationType, setNotificationType] = useState<"email" | "sms" | "internal">("internal");
  const [subject, setSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    if (open) {
      loadPatients();
      loadUsers();
      loadTemplates();
    }
  }, [open]);

  useEffect(() => {
    // Reset recipients when type changes
    setSelectedRecipients([]);
    setSelectedRole("");
  }, [recipientType]);

  const loadPatients = async () => {
    const { data } = await supabase
      .from("patients")
      .select("id, mrn, first_name, last_name, email, phone_mobile")
      .order("created_at", { ascending: false })
      .limit(100);
    setPatients(data || []);
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone_mobile")
      .eq("status", "active")
      .order("first_name", { ascending: true });
    setUsers(data || []);
  };

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("notification_templates")
      .select("*")
      .eq("is_active", true);
    setTemplates(data || []);
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recipientType === "role" && !selectedRole) {
      toast({
        variant: "destructive",
        title: "Missing role",
        description: "Please select a role",
      });
      return;
    }

    if (recipientType !== "role" && selectedRecipients.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing recipients",
        description: "Please select at least one recipient",
      });
      return;
    }

    if (!customMessage && !selectedTemplate) {
      toast({
        variant: "destructive",
        title: "Missing message",
        description: "Please enter a message or select a template",
      });
      return;
    }

    setLoading(true);

    try {
      const template = templates.find((t) => t.id === selectedTemplate);
      let messageBody = customMessage;
      let messageSubject = subject;

      if (template) {
        messageBody = template.body_template;
        messageSubject = template.subject || "";
      }

      const requestData = {
        recipient_type: recipientType,
        recipient_ids: recipientType !== "role" ? selectedRecipients : undefined,
        role: recipientType === "role" ? selectedRole : undefined,
        notification_type: notificationType,
        subject: messageSubject || undefined,
        body: messageBody,
        template_id: selectedTemplate || undefined,
      };

      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: requestData,
      });

      if (error) throw error;

      toast({
        title: "Notifications sent",
        description: `Successfully sent ${data.count} notification${data.count > 1 ? "s" : ""}`,
      });

      setOpen(false);
      resetForm();
      onSent();
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send notifications",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRecipientType("patient");
    setSelectedRole("");
    setSelectedRecipients([]);
    setSelectedTemplate("");
    setNotificationType("internal");
    setSubject("");
    setCustomMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Send Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Notification</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Type */}
          <div>
            <Label>Recipient Type</Label>
            <RadioGroup value={recipientType} onValueChange={(v: any) => setRecipientType(v)} className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="patient" id="patient" />
                <Label htmlFor="patient" className="cursor-pointer">Patients</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user" className="cursor-pointer">Staff (Individual)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="role" id="role" />
                <Label htmlFor="role" className="cursor-pointer">
                  <Users className="h-4 w-4 inline mr-1" />
                  Staff (By Role)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Role Selection */}
          {recipientType === "role" && (
            <div>
              <Label htmlFor="role-select">Select Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose role to notify..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="clinician">Clinicians</SelectItem>
                  <SelectItem value="reception">Reception Staff</SelectItem>
                  <SelectItem value="billing">Billing Staff</SelectItem>
                  <SelectItem value="manager">Managers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Patient Selection */}
          {recipientType === "patient" && (
            <div>
              <Label>Select Patients ({selectedRecipients.length} selected)</Label>
              <div className="mt-2 border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                {patients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No patients found</p>
                ) : (
                  patients.map((patient) => (
                    <div key={patient.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={patient.id}
                        checked={selectedRecipients.includes(patient.id)}
                        onCheckedChange={() => toggleRecipient(patient.id)}
                      />
                      <Label htmlFor={patient.id} className="cursor-pointer flex-1">
                        {patient.mrn} - {patient.first_name} {patient.last_name}
                        {patient.email && <span className="text-muted-foreground ml-2">({patient.email})</span>}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* User Selection */}
          {recipientType === "user" && (
            <div>
              <Label>Select Staff Members ({selectedRecipients.length} selected)</Label>
              <div className="mt-2 border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No staff members found</p>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={user.id}
                        checked={selectedRecipients.includes(user.id)}
                        onCheckedChange={() => toggleRecipient(user.id)}
                      />
                      <Label htmlFor={user.id} className="cursor-pointer flex-1">
                        {user.first_name} {user.last_name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Notification Type */}
          <div>
            <Label htmlFor="notif-type">Notification Channel</Label>
            <Select value={notificationType} onValueChange={(v: any) => setNotificationType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal (System Only)</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection */}
          <div>
            <Label htmlFor="template">Use Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template or write custom message..." />
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
            <>
              {/* Subject */}
              {notificationType === "email" && (
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject..."
                  />
                </div>
              )}

              {/* Custom Message */}
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter your message... You can use {{name}} and {{first_name}} as placeholders."
                  rows={6}
                  required={!selectedTemplate}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use <code className="bg-muted px-1 rounded">{"{{name}}"}</code> or{" "}
                  <code className="bg-muted px-1 rounded">{"{{first_name}}"}</code> for personalization
                </p>
              </div>
            </>
          )}

          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-sm">
            <strong className="text-primary">Note:</strong> This system logs notifications and simulates delivery. 
            In production, integrate with email/SMS services like Resend, Twilio, etc.
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
