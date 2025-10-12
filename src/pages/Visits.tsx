import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Search, ClipboardCheck } from "lucide-react";
import { CreateVisitDialog } from "@/components/visits/CreateVisitDialog";
import { UpdateVisitDialog } from "@/components/visits/UpdateVisitDialog";

const Visits = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updatingVisit, setUpdatingVisit] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadVisits();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadVisits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visits")
      .select(`
        *,
        patients(id, mrn, first_name, last_name),
        primary_provider:profiles!visits_primary_provider_id_fkey(first_name, last_name),
        linked_invoice:invoices(id, total_amount, balance_due, status)
      `)
      .order("opened_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading visits",
        description: error.message,
      });
    } else {
      setVisits(data || []);
    }
    setLoading(false);
  };

  const filteredVisits = visits.filter((visit) => {
    const matchesSearch = visit.patients
      ? `${visit.patients.mrn} ${visit.patients.first_name} ${visit.patients.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : false;
    const matchesStatus = statusFilter === "all" || visit.state === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      initiated: "bg-blue-500",
      payment_pending: "bg-yellow-500",
      payment_confirmed: "bg-green-500",
      in_care: "bg-purple-500",
      discharged: "bg-gray-500",
    };
    return colors[state] || "bg-gray-500";
  };

  const getVisitTypeColor = (type: string) => {
    return type === "walk_in" ? "bg-orange-500" : "bg-blue-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Visits & Admissions</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Patient Visits</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="initiated">Initiated</SelectItem>
                    <SelectItem value="payment_pending">Payment Pending</SelectItem>
                    <SelectItem value="payment_confirmed">Payment Confirmed</SelectItem>
                    <SelectItem value="in_care">In Care</SelectItem>
                    <SelectItem value="discharged">Discharged</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Visit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredVisits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No visits found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Opened At</TableHead>
                      <TableHead>Closed At</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">
                          {visit.patients?.mrn} - {visit.patients?.first_name} {visit.patients?.last_name}
                        </TableCell>
                        <TableCell>
                          <Badge className={getVisitTypeColor(visit.visit_type)}>
                            {visit.visit_type?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStateColor(visit.state)}>
                            {visit.state?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {visit.primary_provider
                            ? `${visit.primary_provider.first_name} ${visit.primary_provider.last_name}`
                            : "—"}
                        </TableCell>
                        <TableCell>{new Date(visit.opened_at).toLocaleString()}</TableCell>
                        <TableCell>
                          {visit.closed_at ? new Date(visit.closed_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell>
                          {visit.linked_invoice ? (
                            <div className="text-sm">
                              <div className="font-medium">
                                ${Number(visit.linked_invoice.total_amount).toFixed(2)}
                              </div>
                              <div className="text-muted-foreground">
                                Due: ${Number(visit.linked_invoice.balance_due).toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUpdatingVisit(visit)}
                          >
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <CreateVisitDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadVisits}
      />

      {updatingVisit && (
        <UpdateVisitDialog
          open={!!updatingVisit}
          onOpenChange={(open) => !open && setUpdatingVisit(null)}
          visit={updatingVisit}
          onSuccess={loadVisits}
        />
      )}
    </div>
  );
};

export default Visits;
