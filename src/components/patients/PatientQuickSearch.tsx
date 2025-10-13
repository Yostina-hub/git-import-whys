import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, UserCheck, CalendarClock, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { AddToQueueDialog } from "./AddToQueueDialog";
import { useToast } from "@/hooks/use-toast";

export function PatientQuickSearch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);

    try {
      // Search with both appointments and visits for complete history
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .or(`mrn.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone_mobile.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch both appointments and visits for each patient
      const patientIds = data?.map(p => p.id) || [];
      
      const [appointmentsRes, visitsRes, notesRes, invoicesRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("patient_id, scheduled_start, status")
          .in("patient_id", patientIds),
        supabase
          .from("visits")
          .select("patient_id, opened_at, state")
          .in("patient_id", patientIds),
        supabase
          .from("emr_notes")
          .select("patient_id, created_at")
          .in("patient_id", patientIds),
        supabase
          .from("invoices")
          .select("patient_id, created_at")
          .in("patient_id", patientIds)
      ]);

      // Process results to add combined visit count
      const processedResults = data?.map(patient => {
        const appointments = appointmentsRes.data?.filter(a => a.patient_id === patient.id) || [];
        const visits = visitsRes.data?.filter(v => v.patient_id === patient.id) || [];
        const notes = notesRes.data?.filter(n => n.patient_id === patient.id) || [];
        const invoices = invoicesRes.data?.filter(i => i.patient_id === patient.id) || [];
        
        // Combine all dates to find the most recent
        const allDates = [
          ...appointments.map(a => ({ date: a.scheduled_start, type: 'appointment' })),
          ...visits.map(v => ({ date: v.opened_at, type: 'visit' })),
          ...notes.map(n => ({ date: n.created_at, type: 'note' })),
          ...invoices.map(i => ({ date: i.created_at, type: 'invoice' })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalVisits = appointments.length + visits.length + notes.length + invoices.length;
        
        return {
          ...patient,
          visitCount: totalVisits,
          lastVisitDate: allDates[0]?.date,
          isReturning: totalVisits > 0
        };
      }) || [];

      setResults(processedResults);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Search error",
        description: error.message,
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by MRN, name, or phone..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {searching && (
        <Card>
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            Searching...
          </CardContent>
        </Card>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-2">
          {results.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      {patient.isReturning && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Returning Patient
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>MRN: {patient.mrn}</div>
                      <div>Phone: {patient.phone_mobile}</div>
                      {patient.lastVisitDate && (
                        <div className="flex items-center gap-1 text-xs">
                          <CalendarClock className="h-3 w-3" />
                          Last visit: {new Date(patient.lastVisitDate).toLocaleDateString()}
                        </div>
                      )}
                      {patient.visitCount > 0 && (
                        <div className="text-xs font-medium text-primary">
                          {patient.visitCount} previous visit{patient.visitCount !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/clinical?patient=${patient.id}`)}
                    >
                      <Stethoscope className="h-4 w-4 mr-1" />
                      View Records
                    </Button>
                    <AddToQueueDialog
                      patientId={patient.id}
                      patientName={`${patient.first_name} ${patient.last_name}`}
                      isReturning={patient.isReturning}
                      onSuccess={() => {
                        setSearchQuery("");
                        setResults([]);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!searching && searchQuery.length >= 2 && results.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">No patients found matching "{searchQuery}"</p>
            <Button variant="outline" onClick={() => navigate("/patients")}>
              Register New Patient
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
