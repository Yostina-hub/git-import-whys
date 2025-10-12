import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SessionsTabProps {
  patientId: string | null;
}

const SessionsTab = ({ patientId }: SessionsTabProps) => {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    loadSessions();
  }, [patientId]);

  const loadSessions = async () => {
    console.log("Loading sessions for patient:", patientId);
    
    let query = supabase
      .from("treatment_sessions")
      .select(`
        *,
        patients(first_name, last_name, mrn)
      `)
      .order("performed_at", { ascending: false });

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("Error loading sessions:", error);
    } else {
      console.log("Loaded sessions:", data);
      setSessions(data || []);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Clinician</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>{new Date(session.performed_at).toLocaleString()}</TableCell>
                <TableCell>
                  {session.patients?.mrn} - {session.patients?.first_name} {session.patients?.last_name}
                </TableCell>
                <TableCell>
                  {session.clinician_id ? `ID ${String(session.clinician_id).slice(0, 8)}…` : "-"}
                </TableCell>
                <TableCell className="max-w-xs truncate">{session.procedure_notes || "-"}</TableCell>
                <TableCell>
                  <Badge>{session.billing_status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No treatment sessions recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionsTab;
