import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, ArrowLeft, Eye, Receipt, UserCheck, History, Calendar, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { DocumentsTab } from "@/components/documents/DocumentsTab";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface Patient {
  id: string;
  mrn: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  sex_at_birth: string;
  phone_mobile: string;
  email?: string;
}

const Patients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Registration service state
  const [registrationService, setRegistrationService] = useState<{
    id: string;
    unit_price: number;
    name: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    sex_at_birth: "male" as const,
    phone_mobile: "",
    phone_alt: "",
    email: "",
    national_id: "",
    address_line1: "",
    city: "",
    country: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const loadRegistrationService = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, unit_price")
      .eq("code", "REG-FEE")
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error loading registration service:", error);
      toast({
        variant: "destructive",
        title: "Warning",
        description: "Could not load registration fee service. Using default value.",
      });
      // Set default fallback
      setRegistrationService({
        id: "",
        name: "Registration Fee",
        unit_price: 50.00
      });
    } else {
      setRegistrationService(data);
    }
  };

  useEffect(() => {
    checkAuth();
    loadRegistrationService();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadPatients = async (page: number = 1, search: string = "") => {
    setLoading(true);
    
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("patients")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply search filter if exists
    if (search) {
      query = query.or(`mrn.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_mobile.ilike.%${search}%`);
    }

    // Get total count with search filter
    const { count } = await query;
    setTotalCount(count || 0);

    // Get paginated data
    const { data, error } = await query.range(from, to);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading patients",
        description: error.message,
      });
      setPatients([]);
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients(currentPage, searchTerm);
  }, [currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registrationService) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Registration service not loaded. Please refresh the page.",
      });
      return;
    }

    setLoading(true);

    try {
      // Generate MRN
      const { data: mrnData } = await supabase.rpc("generate_mrn");
      const mrn = mrnData || `MRN${Date.now()}`;

      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser();

      // Insert patient
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert([{ ...formData, mrn }])
        .select()
        .single();

      if (patientError) throw patientError;

      // Create registration invoice
      const invoiceData = {
        patient_id: patientData.id,
        status: "issued" as const,
        subtotal: registrationService.unit_price,
        tax_amount: 0,
        total_amount: registrationService.unit_price,
        balance_due: registrationService.unit_price,
        issued_at: new Date().toISOString(),
        created_by: user?.id,
        lines: [
          {
            service_id: registrationService.id,
            description: registrationService.name,
            quantity: 1,
            unit_price: registrationService.unit_price,
            total: registrationService.unit_price,
            item_type: "service",
          },
        ],
      };

      const { error: invoiceError } = await supabase
        .from("invoices")
        .insert([invoiceData]);

      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
        toast({
          title: "Patient registered with warning",
          description: `MRN: ${mrn}. Invoice creation failed - please create manually.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Patient registered successfully",
          description: `MRN: ${mrn}. Registration fee invoice created.`,
        });
      }

      setIsDialogOpen(false);
      setCurrentPage(1);
      loadPatients(1);
      // Reset form
      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        date_of_birth: "",
        sex_at_birth: "male",
        phone_mobile: "",
        phone_alt: "",
        email: "",
        national_id: "",
        address_line1: "",
        city: "",
        country: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating patient",
        description: error.message,
      });
    }
    setLoading(false);
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleViewInvoices = (patientId: string, patientName: string) => {
    navigate(`/billing?patient=${patientId}`);
    toast({
      title: "Opening Billing",
      description: `Viewing invoices for ${patientName}`,
    });
  };

  const handleViewAppointments = (patientId: string, patientName: string) => {
    navigate(`/appointments?patient=${patientId}`);
    toast({
      title: "Opening Appointments",
      description: `Viewing appointments for ${patientName}`,
    });
  };

  const handleAssignProvider = (patientId: string) => {
    toast({
      title: "Assign Provider",
      description: "Provider assignment feature - coming soon",
    });
  };

  const handleRecheck = (patientId: string) => {
    toast({
      title: "Schedule Recheck",
      description: "Recheck scheduling feature - coming soon",
    });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    loadPatients(1, value);
  };

  if (selectedPatient) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => setSelectedPatient(null)} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patient List
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h1>
                <p className="text-muted-foreground">MRN: {selectedPatient.mrn}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="documents" className="w-full">
            <TabsList>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="info">Patient Info</TabsTrigger>
            </TabsList>

            <TabsContent value="documents">
              <Card>
                <CardContent className="pt-6">
                  <DocumentsTab patientId={selectedPatient.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Date of Birth</Label>
                      <p className="font-medium">
                        {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Sex at Birth</Label>
                      <p className="font-medium capitalize">{selectedPatient.sex_at_birth}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Mobile Phone</Label>
                      <p className="font-medium">{selectedPatient.phone_mobile}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedPatient.email || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Patient Management</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Patient Registry</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Patient
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Register New Patient</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth *</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sex_at_birth">Gender *</Label>
                        <Select value={formData.sex_at_birth} onValueChange={(value) => setFormData({ ...formData, sex_at_birth: value as any })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone_mobile">Mobile Phone *</Label>
                        <Input
                          id="phone_mobile"
                          type="tel"
                          value={formData.phone_mobile}
                          onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line1">Address</Label>
                      <Input
                        id="address_line1"
                        value={formData.address_line1}
                        onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                        <Input
                          id="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                        <Input
                          id="emergency_contact_phone"
                          type="tel"
                          value={formData.emergency_contact_phone}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Registering..." : "Register Patient"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by MRN, name, or phone..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">MRN</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Gender</TableHead>
                    <TableHead className="font-semibold">DOB</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold">Reg. Fee</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono font-medium text-primary">{patient.mrn}</TableCell>
                      <TableCell className="font-medium">
                        {patient.first_name} {patient.middle_name} {patient.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {patient.sex_at_birth}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(patient.date_of_birth).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{patient.phone_mobile}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          ${registrationService?.unit_price.toFixed(2) || "0.00"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover">
                            <DropdownMenuItem 
                              onClick={() => handleViewPatient(patient)}
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleViewInvoices(patient.id, `${patient.first_name} ${patient.last_name}`)}
                              className="cursor-pointer"
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Invoices & Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleViewAppointments(patient.id, `${patient.first_name} ${patient.last_name}`)}
                              className="cursor-pointer"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Appointments
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleAssignProvider(patient.id)}
                              className="cursor-pointer"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Assign Provider
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRecheck(patient.id)}
                              className="cursor-pointer"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Schedule Recheck
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleViewPatient(patient)}
                              className="cursor-pointer"
                            >
                              <History className="h-4 w-4 mr-2" />
                              Patient History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {patients.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? "No patients found matching your search." : "No patients found. Register your first patient to get started."}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalCount > 0 && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} patients
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <span className="px-3 text-muted-foreground">...</span>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Patients;
