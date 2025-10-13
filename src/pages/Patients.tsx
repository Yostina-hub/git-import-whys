import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePatients, Patient } from "@/hooks/usePatients";
import { useRegistrationService } from "@/hooks/useRegistrationService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, Users, Activity } from "lucide-react";
import { DocumentsTab } from "@/components/documents/DocumentsTab";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientRegistrationForm } from "@/components/patients/PatientRegistrationForm";
import { PatientDetailsDialog } from "@/components/patients/PatientDetailsDialog";
import { IncompleteRegistrations } from "@/components/patients/IncompleteRegistrations";
import { PatientStats } from "@/components/patients/PatientStats";
import { EnhancedPatientCard } from "@/components/patients/EnhancedPatientCard";

const Patients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [resumingPatient, setResumingPatient] = useState<any>(null);
  const [consultationService, setConsultationService] = useState<any>(null);
  const [patientStats, setPatientStats] = useState({
    totalPatients: 0,
    newToday: 0,
    pendingRegistrations: 0,
    completedToday: 0,
  });
  
  const registrationService = useRegistrationService();
  
  // Load consultation service
  useState(() => {
    const loadConsultationService = async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name, unit_price")
        .eq("code", "CONSULT")
        .eq("is_active", true)
        .maybeSingle();
      
      if (data) {
        setConsultationService(data);
      }
    };
    loadConsultationService();
  });
  const {
    patients,
    loading,
    totalCount,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    refetch,
    ITEMS_PER_PAGE,
  } = usePatients();

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsDialog(true);
  };

  const handleViewInvoices = (patientId: string, invoiceId: string | undefined, patientName: string) => {
    if (invoiceId) {
      navigate(`/billing?invoice=${invoiceId}`);
    } else {
      navigate(`/billing?patient=${patientId}`);
    }
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

  const handleRegistrationSuccess = () => {
    setIsDialogOpen(false);
    setResumingPatient(null);
    setCurrentPage(1);
    refetch();
  };

  const handleResumeRegistration = (patient: any) => {
    setResumingPatient(patient);
    setIsDialogOpen(true);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const loadPatientStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Total patients
    const { count: total } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });
    
    // New today
    const { count: newToday } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);
    
    // Pending registrations
    const { count: pending } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("registration_status", "pending");
    
    // Completed today
    const { count: completed } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("registration_status", "completed")
      .gte("updated_at", today);

    setPatientStats({
      totalPatients: total || 0,
      newToday: newToday || 0,
      pendingRegistrations: pending || 0,
      completedToday: completed || 0,
    });
  };

  useEffect(() => {
    loadPatientStats();
  }, [patients]);

  // Patient List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  refetch();
                  loadPatientStats();
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Patient Management
              </h1>
              <p className="text-sm text-muted-foreground">Manage and track all patient records</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Patient Stats Overview */}
        <PatientStats
          totalPatients={patientStats.totalPatients}
          newToday={patientStats.newToday}
          pendingRegistrations={patientStats.pendingRegistrations}
          completedToday={patientStats.completedToday}
        />

        {/* Show incomplete registrations */}
        <IncompleteRegistrations onResumeRegistration={handleResumeRegistration} />
        
        <Card className="bg-gradient-to-br from-card to-card/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-2xl">Patient Registry</CardTitle>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    New Patient
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Register New Patient</DialogTitle>
                  </DialogHeader>
                  {registrationService && (
                    <PatientRegistrationForm
                      registrationServiceId={registrationService.id}
                      registrationPrice={registrationService.unit_price}
                      consultationServiceId={consultationService?.id}
                      consultationPrice={consultationService?.unit_price}
                      onSuccess={handleRegistrationSuccess}
                      onCancel={() => {
                        setIsDialogOpen(false);
                        setResumingPatient(null);
                      }}
                      existingPatient={resumingPatient}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by MRN, name, or phone..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-12 bg-background/50 border-muted-foreground/20 focus:border-primary"
              />
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="text-lg">Loading patients...</span>
                </div>
              </div>
            ) : patients.length === 0 ? (
              <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-dashed">
                <CardContent className="text-center py-20">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg text-muted-foreground">
                    {searchTerm ? "No patients found matching your search." : "No patients found. Register your first patient to get started."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patients.map((patient) => (
                    <EnhancedPatientCard
                      key={patient.id}
                      patient={patient}
                      onViewPatient={handleViewPatient}
                      onViewInvoices={handleViewInvoices}
                      onViewAppointments={handleViewAppointments}
                    />
                  ))}
                </div>

                {totalCount > 0 && (
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Patient Details Dialog */}
        <PatientDetailsDialog
          patient={selectedPatient}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      </main>
    </div>
  );
};

export default Patients;
