import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, Clock } from "lucide-react";

interface ConsentsTabProps {
  patientId: string | null;
}

const ConsentsTab = ({ patientId }: ConsentsTabProps) => {
  const { toast } = useToast();
  const [consents, setConsents] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: patientId || "",
    consent_type: "general_treatment" as const,
    signed_by: "patient",
  });

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    const [consentsRes, patientsRes] = await Promise.all([
      supabase
        .from("consent_forms")
        .select("*, patients(first_name, last_name, mrn)")
        .order("created_at", { ascending: false })
        .then(res => patientId ? { ...res, data: res.data?.filter(c => c.patient_id === patientId) } : res),
      supabase.from("patients").select("*").order("first_name"),
    ]);

    if (consentsRes.data) setConsents(consentsRes.data);
    if (patientsRes.data) setPatients(patientsRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("consent_forms").insert([
      {
        ...formData,
        signed_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating consent",
        description: error.message,
      });
    } else {
      toast({
        title: "Consent recorded",
        description: "The consent form has been saved successfully.",
      });
      setIsDialogOpen(false);
      loadData();
      setFormData({
        patient_id: patientId || "",
        consent_type: "general_treatment",
        signed_by: "patient",
      });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Consent Forms</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Consent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Consent</DialogTitle>
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
                  <Label>Consent Type *</Label>
                  <Select value={formData.consent_type} onValueChange={(value: any) => setFormData({ ...formData, consent_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_treatment">General Treatment</SelectItem>
                      <SelectItem value="data_privacy">Data Privacy</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="telehealth">Telehealth</SelectItem>
                      <SelectItem value="package_treatment">Package Treatment</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Signed By *</Label>
                  <Select value={formData.signed_by} onValueChange={(value) => setFormData({ ...formData, signed_by: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Recording..." : "Record Consent"}
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
              <TableHead>Patient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Signed By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consents.map((consent) => {
              const isExpired = consent.expires_at && new Date(consent.expires_at) < new Date();
              return (
                <TableRow key={consent.id}>
                  <TableCell>
                    {consent.patients?.mrn} - {consent.patients?.first_name} {consent.patients?.last_name}
                  </TableCell>
                  <TableCell>{consent.consent_type.replace(/_/g, " ")}</TableCell>
                  <TableCell>{consent.signed_by}</TableCell>
                  <TableCell>
                    {consent.signed_at ? new Date(consent.signed_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {consent.signed_at ? (
                      isExpired ? (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Clock className="h-4 w-4" />
                          <span>Expired</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Signed</span>
                        </div>
                      )
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {consents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No consent forms recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsentsTab;
