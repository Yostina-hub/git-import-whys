import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Template {
  id: string;
  name: string;
  type: string;
  event_type: string;
  subject: string | null;
  body_template: string;
  is_active: boolean;
}

export const NotificationTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notification_templates" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTemplates(data as any);
    }
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(template.type)}
                    <span className="capitalize">{template.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{template.event_type.replace("_", " ")}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{template.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {template.subject && (
                          <div>
                            <div className="text-sm font-medium mb-1">Subject:</div>
                            <div className="p-3 bg-muted rounded">{template.subject}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium mb-1">Body Template:</div>
                          <div className="p-3 bg-muted rounded whitespace-pre-wrap">
                            {template.body_template}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Variables like {`{{patient_name}}`}, {`{{appointment_date}}`} will be replaced
                          with actual values when sent.
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
