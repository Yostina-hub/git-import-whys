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
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          appointments:appointments(count),
          last_visit:appointments(scheduled_start, status)
        `)
        .or(`mrn.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone_mobile.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      // Process results to add visit count and last visit info
      const processedResults = data?.map(patient => {
        const visits = patient.appointments as any[];
        const lastVisit = visits && visits.length > 0 
          ? visits.sort((a: any, b: any) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime())[0]
          : null;
        
        return {
          ...patient,
          visitCount: visits?.length || 0,
          lastVisitDate: lastVisit?.scheduled_start,
          isReturning: (visits?.length || 0) > 0
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
