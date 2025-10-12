import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface AssessmentsTabProps {
  patientId: string | null;
}

const AssessmentsTab = ({ patientId }: AssessmentsTabProps) => {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    patient_id: patientId || "",
    template_id: "",
    assessment_stage: "S3" as const,
    responses: {} as Record<string, any>,
  });

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    const [assessRes, templatesRes, patientsRes] = await Promise.all([
      supabase
        .from("assessments")
        .select("*, patients(first_name, last_name, mrn), assessment_templates(name)")
        .order("created_at", { ascending: false })
        .then(res => patientId ? { ...res, data: res.data?.filter(a => a.patient_id === patientId) } : res),
      supabase.from("assessment_templates").select("*").eq("is_active", true),
      supabase.from("patients").select("*").order("first_name"),
    ]);

    if (assessRes.data) setAssessments(assessRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
    if (patientsRes.data) setPatients(patientsRes.data);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      template_id: templateId,
      assessment_stage: template?.stage || "S3",
      responses: {},
    }));
  };

  const handleResponseChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      responses: { ...prev.responses, [fieldKey]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from("assessments")
      .insert([
        {
          ...formData,
          completed_by: user?.id,
          completed_at: new Date().toISOString(),
        },
      ])
      .select("*, patients(first_name, last_name, mrn), assessment_templates(name)")
      .single();

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating assessment",
        description: error.message,
      });
    } else {
      // Optimistically add to list instead of reloading everything
      setAssessments(prev => [data, ...prev]);
      
      toast({
        title: "Assessment created",
        description: "The assessment has been saved successfully.",
      });
      setIsDialogOpen(false);
      setFormData({
        patient_id: patientId || "",
        template_id: "",
        assessment_stage: "S3" as const,
        responses: {},
      });
      setSelectedTemplate(null);
    }
  };

  const renderField = (field: any) => {
    const value = formData.responses[field.key] || "";

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleResponseChange(field.key, e.target.value)}
            required={field.required}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleResponseChange(field.key, e.target.value)}
            min={field.min}
            max={field.max}
            required={field.required}
          />
        );
      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleResponseChange(field.key, e.target.checked)}
            className="h-4 w-4"
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleResponseChange(field.key, e.target.value)}
            required={field.required}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleResponseChange(field.key, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assessments</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Assessment</DialogTitle>
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
                  <Label>Assessment Template *</Label>
                  <Select value={formData.template_id} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.stage})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && selectedTemplate.schema?.fields && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">Assessment Fields</h3>
                    {selectedTemplate.schema.fields.map((field: any) => (
                      <div key={field.key} className="space-y-2">
                        <Label>
                          {field.label} {field.required && "*"}
                        </Label>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Save Assessment"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Completed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.map((assessment) => (
              <TableRow key={assessment.id}>
                <TableCell>{new Date(assessment.completed_at || assessment.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {assessment.patients?.mrn} - {assessment.patients?.first_name} {assessment.patients?.last_name}
                </TableCell>
                <TableCell>{assessment.assessment_templates?.name}</TableCell>
                <TableCell>{assessment.assessment_stage}</TableCell>
                <TableCell>{assessment.score || "-"}</TableCell>
                <TableCell>
                  {assessment.completed_by ? `ID ${String(assessment.completed_by).slice(0, 8)}…` : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {assessments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No assessments recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssessmentsTab;
