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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface ProtocolsTabProps {
  patientId: string | null;
}

const ProtocolsTab = ({ patientId }: ProtocolsTabProps) => {
  const { toast } = useToast();
  const [protocols, setProtocols] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: patientId || "",
    name: "",
    goals: "",
    is_optional: false,
    status: "draft" as const,
  });

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    const [protocolsRes, patientsRes] = await Promise.all([
      supabase
        .from("treatment_protocols")
        .select("*, patients(first_name, last_name, mrn), profiles(first_name, last_name)")
        .order("created_at", { ascending: false })
        .then(res => patientId ? { ...res, data: res.data?.filter(p => p.patient_id === patientId) } : res),
      supabase.from("patients").select("*").order("first_name"),
    ]);

    if (protocolsRes.data) setProtocols(protocolsRes.data);
    if (patientsRes.data) setPatients(patientsRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("treatment_protocols").insert([
      {
        ...formData,
        owner_provider_id: user?.id,
      },
    ]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating protocol",
        description: error.message,
      });
    } else {
      toast({
        title: "Protocol created",
        description: "The treatment protocol has been saved successfully.",
      });
      setIsDialogOpen(false);
      loadData();
      setFormData({
        patient_id: patientId || "",
        name: "",
        goals: "",
        is_optional: false,
        status: "draft",
      });
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      active: "bg-green-500",
      on_hold: "bg-yellow-500",
      completed: "bg-blue-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Treatment Protocols</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Protocol
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Treatment Protocol</DialogTitle>
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
                  <Label>Protocol Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Zemar Treatment - 6 Sessions"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Treatment Goals</Label>
                  <Textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    placeholder="Describe the treatment goals and objectives..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Protocol"}
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
              <TableHead>Protocol Name</TableHead>
              <TableHead>Goals</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {protocols.map((protocol) => (
              <TableRow key={protocol.id}>
                <TableCell>
                  {protocol.patients?.mrn} - {protocol.patients?.first_name} {protocol.patients?.last_name}
                </TableCell>
                <TableCell className="font-medium">{protocol.name}</TableCell>
                <TableCell className="max-w-xs truncate">{protocol.goals || "-"}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(protocol.status)}>
                    {protocol.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(protocol.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {protocols.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No treatment protocols created yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProtocolsTab;
