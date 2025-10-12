import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pill } from "lucide-react";
import { AddMedicationDialog } from "./AddMedicationDialog";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface MedicationsTabProps {
  patientId: string | null;
}

export function MedicationsTab({ patientId }: MedicationsTabProps) {
  const { toast } = useToast();
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (patientId) {
      loadMedications();
    }
  }, [patientId, currentPage, pageSize]);

  const loadMedications = async () => {
    if (!patientId) return;
    
    setLoading(true);
    
    const { count } = await supabase
      .from("medications")
      .select("*", { count: "exact", head: true })
      .eq("patient_id", patientId);
    
    setTotalCount(count || 0);
    
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from("medications")
      .select("*, prescribed_by:profiles!medications_prescribed_by_fkey(first_name, last_name)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading medications",
        description: error.message,
      });
    } else {
      setMedications(data || []);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500",
      completed: "bg-blue-500",
      discontinued: "bg-red-500",
      on_hold: "bg-yellow-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Medications</CardTitle>
          {patientId && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : medications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No medications prescribed yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Prescribed By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.map((med) => (
                <TableRow key={med.id}>
                  <TableCell className="font-medium">{med.medication_name}</TableCell>
                  <TableCell>{med.dosage}</TableCell>
                  <TableCell>{med.route || '—'}</TableCell>
                  <TableCell>{med.frequency}</TableCell>
                  <TableCell>{new Date(med.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {med.end_date ? new Date(med.end_date).toLocaleDateString() : 'Ongoing'}
                  </TableCell>
                  <TableCell>
                    {med.prescribed_by?.first_name} {med.prescribed_by?.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(med.status)}>
                      {med.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {med.notes || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {!loading && medications.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / pageSize)}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </CardContent>

      <AddMedicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patientId={patientId}
        onSuccess={loadMedications}
      />
    </Card>
  );
}
