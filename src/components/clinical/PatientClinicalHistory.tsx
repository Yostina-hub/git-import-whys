import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClinicalSummary } from "./ClinicalSummary";
import { VisitTimeline } from "./VisitTimeline";
import { ClinicalAIAssistant } from "./ClinicalAIAssistant";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PatientClinicalHistoryProps {
  patientId: string | null;
}

export const PatientClinicalHistory = ({ patientId }: PatientClinicalHistoryProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalNotes: 0,
    activeMedications: 0,
    allergies: 0,
    lastVisit: null as string | null,
    upcomingAppointments: 0,
  });
  const [visits, setVisits] = useState<any[]>([]);
  const [emrNotes, setEmrNotes] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [recentVitals, setRecentVitals] = useState<any[]>([]);

  useEffect(() => {
    if (patientId) {
      loadClinicalData();
    }
  }, [patientId]);

  const loadClinicalData = async () => {
    if (!patientId) return;

    setLoading(true);

    try {
      // Load all clinical data in parallel
      const [
        patientRes,
        visitsRes,
        notesRes,
        medicationsRes,
        allergiesRes,
        appointmentsRes,
        vitalsRes,
      ] = await Promise.all([
        // Patient info
        supabase
          .from("patients")
          .select("*")
          .eq("id", patientId)
          .maybeSingle(),
        
        // Visits
        supabase
          .from("visits")
          .select("*")
          .eq("patient_id", patientId)
          .order("opened_at", { ascending: false }),
        
        // EMR Notes with author info
        supabase
          .from("emr_notes")
          .select(`
            *,
            author:profiles!emr_notes_author_id_fkey(first_name, last_name)
          `)
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
        
        // Active Medications
        supabase
          .from("medications")
          .select("*")
          .eq("patient_id", patientId)
          .eq("status", "active"),
        
        // Allergies
        supabase
          .from("allergies")
          .select("*")
          .eq("patient_id", patientId),
        
        // Upcoming Appointments
        supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patientId)
          .gte("scheduled_start", new Date().toISOString())
          .in("status", ["booked", "confirmed"]),
        
        // Recent vital signs
        supabase
          .from("vital_signs")
          .select("*")
          .eq("patient_id", patientId)
          .order("recorded_at", { ascending: false })
          .limit(10)
      ]);

      // Set stats
      setStats({
        totalVisits: visitsRes.data?.length || 0,
        totalNotes: notesRes.data?.length || 0,
        activeMedications: medicationsRes.data?.length || 0,
        allergies: allergiesRes.data?.length || 0,
        lastVisit: visitsRes.data?.[0]?.opened_at || notesRes.data?.[0]?.created_at || null,
        upcomingAppointments: appointmentsRes.data?.length || 0,
      });

      setPatient(patientRes.data);
      setVisits(visitsRes.data || []);
      setEmrNotes(notesRes.data || []);
      setMedications(medicationsRes.data || []);
      setAllergies(allergiesRes.data || []);
      setRecentVitals(vitalsRes.data || []);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading clinical data",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>Please select a patient to view clinical records</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="space-y-6">
      <ClinicalSummary stats={stats} />
      
      <ClinicalAIAssistant
        patientData={{
          patient: patient ? {
            ...patient,
            age: patient.date_of_birth ? calculateAge(patient.date_of_birth) : null,
          } : null,
          stats,
          allergies: allergies,
          medications: medications,
          recentNotes: emrNotes.slice(0, 5),
          recentVitals: recentVitals,
        }}
      />
      
      <VisitTimeline visits={visits} emrNotes={emrNotes} />
    </div>
  );
};
