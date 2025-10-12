import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Stethoscope, ClipboardList, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AssessmentsTab from "@/components/clinical/AssessmentsTab";
import ProtocolsTab from "@/components/clinical/ProtocolsTab";
import SessionsTab from "@/components/clinical/SessionsTab";
import EMRNotesTab from "@/components/clinical/EMRNotesTab";
import ConsentsTab from "@/components/clinical/ConsentsTab";
import { VitalSignsTab } from "@/components/clinical/VitalSignsTab";
import { MedicationsTab } from "@/components/clinical/MedicationsTab";
import { AllergiesTab } from "@/components/clinical/AllergiesTab";

const ClinicalRecords = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patient");
  const [patient, setPatient] = useState<any>(null);

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
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading patient",
        description: error.message,
      });
    } else {
      setPatient(data);
    }
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
              <h1 className="text-2xl font-bold">Clinical Records</h1>
              {patient && (
                <p className="text-sm text-muted-foreground">
                  {patient.mrn} - {patient.first_name} {patient.last_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="vitals" className="w-full">
          <TabsList className="grid w-full grid-cols-7 h-auto flex-wrap">
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="allergies">Allergies</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="notes">EMR Notes</TabsTrigger>
            <TabsTrigger value="consents">Consents</TabsTrigger>
          </TabsList>

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

          {/* Hidden for future use */}
          {/* <TabsContent value="protocols">
            <ProtocolsTab patientId={patientId} />
          </TabsContent> */}

          <TabsContent value="sessions">
            <SessionsTab patientId={patientId} />
          </TabsContent>

          <TabsContent value="notes">
            <EMRNotesTab patientId={patientId} />
          </TabsContent>

          <TabsContent value="consents">
            <ConsentsTab patientId={patientId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClinicalRecords;
