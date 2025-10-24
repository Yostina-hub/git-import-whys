import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, History, Heart, Pill, AlertCircle, FileText, ClipboardList, FileSignature, RefreshCw, Activity, FolderOpen } from "lucide-react";
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
import { ClinicalStats } from "@/components/clinical/ClinicalStats";
import { PatientInfoCard } from "@/components/clinical/PatientInfoCard";
import { DocumentsTab } from "@/components/documents/DocumentsTab";

const ClinicalRecords = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const patientId = searchParams.get("patient");
  const [patient, setPatient] = useState<any>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [clinicalCounts, setClinicalCounts] = useState({
    vitals: 0,
    medications: 0,
    allergies: 0,
    notes: 0,
  });

  useEffect(() => {
    checkAuth();
    if (patientId) {
      loadPatient();
      loadClinicalCounts();
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

  const loadClinicalCounts = async () => {
    if (!patientId) return;

    try {
      const [vitalsRes, medsRes, allergiesRes, notesRes] = await Promise.all([
        supabase.from("vital_signs").select("id", { count: "exact", head: true }).eq("patient_id", patientId),
        supabase.from("medications").select("id", { count: "exact", head: true }).eq("patient_id", patientId),
        supabase.from("allergies").select("id", { count: "exact", head: true }).eq("patient_id", patientId),
        supabase.from("emr_notes").select("id", { count: "exact", head: true }).eq("patient_id", patientId),
      ]);

      setClinicalCounts({
        vitals: vitalsRes.count || 0,
        medications: medsRes.count || 0,
        allergies: allergiesRes.count || 0,
        notes: notesRes.count || 0,
      });
    } catch (error) {
      console.error("Error loading clinical counts:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/dashboard")}
                className="hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Clinical Records
                  </h1>
                  <p className="text-sm text-muted-foreground">Electronic Medical Records</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {patient && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadClinicalCounts}
                  className="gap-2 hover:bg-primary/10 transition-all duration-300"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              )}
              <div className="w-full sm:w-80">
                <PatientQuickSearch onPatientSelect={handlePatientSelect} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {!patientId ? (
          <Card className="border-dashed">
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <div className="p-4 rounded-full bg-muted inline-block mb-4">
                  <User className="h-16 w-16 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No Patient Selected</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Use the search bar above to find and select a patient to view their clinical records
                  </p>
                  <Button 
                    onClick={() => navigate("/patients")}
                    className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Go to Patient Management
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Patient Info Card */}
            {patient ? (
              <PatientInfoCard patient={patient} age={patient.date_of_birth ? calculateAge(patient.date_of_birth) : 0} />
            ) : (
              <Card><CardContent className="p-6 text-muted-foreground">Loading patient...</CardContent></Card>
            )}


            {/* Clinical Stats */}
            <ClinicalStats
              vitalsCount={clinicalCounts.vitals}
              medicationsCount={clinicalCounts.medications}
              allergiesCount={clinicalCounts.allergies}
              notesCount={clinicalCounts.notes}
            />

            {/* Clinical Tabs */}
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 h-auto p-1 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger 
                  value="history" 
                  className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="vitals"
                  className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Vitals</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="medications"
                  className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Pill className="h-4 w-4" />
                  <span className="hidden sm:inline">Medications</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="allergies"
                  className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Allergies</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="assessments"
                  className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">Assessments</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notes"
                  className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">EMR Notes</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="consents"
                  className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <FileSignature className="h-4 w-4" />
                  <span className="hidden sm:inline">Consents</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="documents"
                  className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
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

            <TabsContent value="documents">
              <DocumentsTab patientId={patientId} />
            </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClinicalRecords;
