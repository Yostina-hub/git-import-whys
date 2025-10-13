import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePatients, Patient } from "@/hooks/usePatients";
import { useRegistrationService } from "@/hooks/useRegistrationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { DocumentsTab } from "@/components/documents/DocumentsTab";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientRegistrationForm } from "@/components/patients/PatientRegistrationForm";
import { PatientDetailsDialog } from "@/components/patients/PatientDetailsDialog";

const Patients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const registrationService = useRegistrationService();
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
    setCurrentPage(1);
    refetch();
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

  // Patient List View
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
                  {registrationService && (
                    <PatientRegistrationForm
                      registrationServiceId={registrationService.id}
                      registrationPrice={registrationService.unit_price}
                      onSuccess={handleRegistrationSuccess}
                      onCancel={() => setIsDialogOpen(false)}
                    />
                  )}
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

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading patients...
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? "No patients found matching your search." : "No patients found. Register your first patient to get started."}
              </div>
            ) : (
              <>
                <PatientTable
                  patients={patients}
                  registrationFee={registrationService?.unit_price || 0}
                  onViewPatient={handleViewPatient}
                  onViewInvoices={handleViewInvoices}
                  onViewAppointments={handleViewAppointments}
                  onRefresh={refetch}
                />

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
