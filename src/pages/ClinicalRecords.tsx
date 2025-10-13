import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AssessmentsTab from "@/components/clinical/AssessmentsTab";
import SessionsTab from "@/components/clinical/SessionsTab";
import EMRNotesTab from "@/components/clinical/EMRNotesTab";
import ConsentsTab from "@/components/clinical/ConsentsTab";
import { VitalSignsTab } from "@/components/clinical/VitalSignsTab";
import { MedicationsTab } from "@/components/clinical/MedicationsTab";
import { AllergiesTab } from "@/components/clinical/AllergiesTab";
import { PatientClinicalHistory } from "@/components/clinical/PatientClinicalHistory";
import { PatientQuickSearch } from "@/components/patients/PatientQuickSearch";
import { Badge } from "@/components/ui/badge";

const ClinicalRecords = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const patientId = searchParams.get("patient");
  const [patient, setPatient] = useState<any>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  useEffect(() => {
    checkAuth();
    if (patientId) {
      loadPatient();
    }
  }, [patientId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadPatient = async () => {
    if (!patientId) return;

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .maybeSingle();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading patient",
        description: error.message,
      });
    } else if (data) {
      setPatient(data);
    }
  };

  const handlePatientSelect = (selectedPatient: any) => {
    setSearchParams({ patient: selectedPatient.id });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold">Clinical Records</h1>
                {patient && (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono">
                      {patient.mrn}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {patient.first_name} {patient.last_name}
                    </span>
                    {patient.date_of_birth && (
                      <Badge variant="secondary" className="text-xs">
                        {calculateAge(patient.date_of_birth)} years
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full sm:w-80">
              <PatientQuickSearch onPatientSelect={handlePatientSelect} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!patientId ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <User className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Patient Selected</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the search bar above to find and select a patient to view their clinical records
                  </p>
                  <Button onClick={() => navigate("/patients")}>
                    Go to Patient Management
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto">
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="notes">EMR Notes</TabsTrigger>
              <TabsTrigger value="consents">Consents</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-6">
              <PatientClinicalHistory patientId={patientId} />
            </TabsContent>

            <TabsContent value="vitals">
              <VitalSignsTab patientId={patientId} />
            </TabsContent>

            <TabsContent value="medications">
              <MedicationsTab patientId={patientId} />
            </TabsContent>

            <TabsContent value="allergies">
              <AllergiesTab patientId={patientId} />
            </TabsContent>

            <TabsContent value="assessments">
              <AssessmentsTab patientId={patientId} />
            </TabsContent>

            <TabsContent value="notes">
              <EMRNotesTab 
                patientId={patientId} 
                onNoteCreated={() => setShowConsentDialog(true)}
              />
            </TabsContent>

            <TabsContent value="consents">
              <ConsentsTab 
                patientId={patientId} 
                autoOpen={showConsentDialog}
                onAutoOpenChange={(open) => setShowConsentDialog(open)}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default ClinicalRecords;
