import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, PlayCircle } from "lucide-react";
import { format } from "date-fns";

interface IncompletePatient {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  phone_mobile: string;
  registration_status: string;
  created_at: string;
  registration_notes?: string;
}

interface Props {
  onResumeRegistration: (patient: IncompletePatient) => void;
}

export const IncompleteRegistrations = ({ onResumeRegistration }: Props) => {
  const { toast } = useToast();
  const [incompletePatients, setIncompletePatients] = useState<IncompletePatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncompleteRegistrations();
  }, []);

  const loadIncompleteRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .neq("registration_status", "completed")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setIncompletePatients(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading incomplete registrations",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (patient: IncompletePatient) => {
    // Fetch fresh data from database to ensure we have the latest status
    try {
      const { data: freshPatient, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patient.id)
        .single();

      if (error) throw error;

      // Pass the fresh data
      onResumeRegistration(freshPatient);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading patient data",
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      consented: { variant: "default", label: "Consented" },
      paid: { variant: "default", label: "Paid" },
    };
    
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (incompletePatients.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No incomplete registrations found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          Incomplete Registrations
        </CardTitle>
        <CardDescription>
          Resume interrupted or pending patient registrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {incompletePatients.map((patient) => (
            <div
              key={patient.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">
                    {patient.first_name} {patient.last_name}
                  </h3>
                  {getStatusBadge(patient.registration_status)}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>MRN: {patient.mrn}</p>
                  <p>Phone: {patient.phone_mobile}</p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Started: {format(new Date(patient.created_at), "PPp")}
                  </p>
                  {patient.registration_notes && (
                    <p className="text-xs italic">Note: {patient.registration_notes}</p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleResume(patient)}
                size="sm"
                className="ml-4"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Resume
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
