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
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  ClipboardCheck, 
  Users, 
  Activity, 
  DollarSign, 
  Clock,
  TrendingUp,
  Calendar,
  FileText,
  Eye
} from "lucide-react";
import { CreateVisitDialog } from "@/components/visits/CreateVisitDialog";
import { UpdateVisitDialog } from "@/components/visits/UpdateVisitDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const Visits = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updatingVisit, setUpdatingVisit] = useState<any>(null);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    discharged: 0,
    avgDuration: 0,
    revenue: 0,
    pending: 0
  });

  useEffect(() => {
    checkAuth();
    loadVisits();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [visits]);

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
        patients(id, mrn, first_name, last_name, date_of_birth, phone_mobile, sex_at_birth),
        linked_invoice:invoices(id, total_amount, balance_due, status)
      `)
      .order("opened_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading visits",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    // Fetch provider details separately for each visit
    const visitsWithProviders = await Promise.all(
      (data || []).map(async (visit) => {
        if (visit.primary_provider_id) {
          const { data: provider } = await supabase
            .from("profiles")
            .select("first_name, last_name, specialty")
            .eq("id", visit.primary_provider_id)
            .single();
          
          return {
            ...visit,
            primary_provider: provider
          };
        }
        return visit;
      })
    );

    setVisits(visitsWithProviders);
    setLoading(false);
  };

  const calculateStats = () => {
    const total = visits.length;
    const active = visits.filter(v => ['initiated', 'payment_pending', 'payment_confirmed', 'in_care'].includes(v.state)).length;
    const discharged = visits.filter(v => v.state === 'discharged').length;
    const pending = visits.filter(v => ['initiated', 'payment_pending'].includes(v.state)).length;
    
    // Calculate average duration for closed visits
    const closedVisits = visits.filter(v => v.closed_at);
    const avgDuration = closedVisits.length > 0
      ? closedVisits.reduce((sum, v) => {
          const duration = new Date(v.closed_at).getTime() - new Date(v.opened_at).getTime();
          return sum + duration;
        }, 0) / closedVisits.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Calculate total revenue
    const revenue = visits.reduce((sum, v) => {
      return sum + (v.linked_invoice ? Number(v.linked_invoice.total_amount) : 0);
    }, 0);

    setStats({ total, active, discharged, avgDuration, revenue, pending });
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

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getVisitDuration = (opened: string, closed?: string) => {
    const start = new Date(opened);
    const end = closed ? new Date(closed) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Visits & Admissions</h1>
              <p className="text-muted-foreground mt-1">Track patient journeys from admission to discharge</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              New Visit
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card className="hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <ClipboardCheck className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-3xl font-bold mt-2 text-green-600">{stats.active}</p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-full">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.pending}</p>
                </div>
                <div className="bg-yellow-500/10 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Discharged</p>
                  <p className="text-3xl font-bold mt-2">{stats.discharged}</p>
                </div>
                <div className="bg-gray-500/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-3xl font-bold mt-2">{stats.avgDuration.toFixed(1)}h</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-3xl font-bold mt-2">${stats.revenue.toLocaleString()}</p>
                </div>
                <div className="bg-purple-500/10 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Patient Visits
              </CardTitle>
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading visits...</p>
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No visits found</p>
                <p className="text-sm mt-2">Create a new visit to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.map((visit) => (
                      <TableRow key={visit.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {visit.patients?.first_name} {visit.patients?.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              MRN: {visit.patients?.mrn}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {visit.patients?.phone_mobile}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{calculateAge(visit.patients?.date_of_birth)} years</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {visit.patients?.sex_at_birth}
                            </span>
                          </div>
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
                          <div className="flex flex-col">
                            {visit.primary_provider ? (
                              <>
                                <span className="font-medium">
                                  Dr. {visit.primary_provider.first_name} {visit.primary_provider.last_name}
                                </span>
                                {visit.primary_provider.specialty && (
                                  <span className="text-xs text-muted-foreground">
                                    {visit.primary_provider.specialty}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {getVisitDuration(visit.opened_at, visit.closed_at)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(visit.opened_at).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {visit.linked_invoice ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-lg">
                                ${Number(visit.linked_invoice.total_amount).toFixed(2)}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={visit.linked_invoice.status === 'paid' ? 'default' : 'secondary'}
                                  className={visit.linked_invoice.status === 'paid' ? 'bg-green-600' : ''}
                                >
                                  {visit.linked_invoice.status}
                                </Badge>
                                {visit.linked_invoice.balance_due > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    Due: ${Number(visit.linked_invoice.balance_due).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No invoice</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedVisit(visit)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUpdatingVisit(visit)}
                            >
                              Update
                            </Button>
                          </div>
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

      {/* Visit Details Sheet */}
      <Sheet open={!!selectedVisit} onOpenChange={(open) => !open && setSelectedVisit(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedVisit && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Visit Details
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Patient Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-semibold">
                        {selectedVisit.patients?.first_name} {selectedVisit.patients?.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MRN:</span>
                      <span className="font-mono">{selectedVisit.patients?.mrn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Age:</span>
                      <span>{calculateAge(selectedVisit.patients?.date_of_birth)} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="capitalize">{selectedVisit.patients?.sex_at_birth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{selectedVisit.patients?.phone_mobile}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Visit Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Visit Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge className={getVisitTypeColor(selectedVisit.visit_type)}>
                        {selectedVisit.visit_type?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={getStateColor(selectedVisit.state)}>
                        {selectedVisit.state?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {getVisitDuration(selectedVisit.opened_at, selectedVisit.closed_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opened:</span>
                      <span>{new Date(selectedVisit.opened_at).toLocaleString()}</span>
                    </div>
                    {selectedVisit.closed_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Closed:</span>
                        <span>{new Date(selectedVisit.closed_at).toLocaleString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Provider Info */}
                {selectedVisit.primary_provider && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Assigned Provider</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-semibold">
                          Dr. {selectedVisit.primary_provider.first_name} {selectedVisit.primary_provider.last_name}
                        </span>
                      </div>
                      {selectedVisit.primary_provider.specialty && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Specialty:</span>
                          <span>{selectedVisit.primary_provider.specialty}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Payment Info */}
                {selectedVisit.linked_invoice && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="text-2xl font-bold">
                          ${Number(selectedVisit.linked_invoice.total_amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Balance Due:</span>
                        <span className="text-xl font-semibold text-orange-600">
                          ${Number(selectedVisit.linked_invoice.balance_due).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge 
                          variant={selectedVisit.linked_invoice.status === 'paid' ? 'default' : 'secondary'}
                          className={selectedVisit.linked_invoice.status === 'paid' ? 'bg-green-600' : ''}
                        >
                          {selectedVisit.linked_invoice.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => {
                      setUpdatingVisit(selectedVisit);
                      setSelectedVisit(null);
                    }}
                  >
                    Update Visit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedVisit(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Visits;
