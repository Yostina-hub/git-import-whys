import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, AlertTriangle } from "lucide-react";
import { AddAllergyDialog } from "./AddAllergyDialog";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface AllergiesTabProps {
  patientId: string | null;
}

export function AllergiesTab({ patientId }: AllergiesTabProps) {
  const { toast } = useToast();
  const [allergies, setAllergies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (patientId) {
      loadAllergies();
    }
  }, [patientId, currentPage, pageSize]);

  const loadAllergies = async () => {
    if (!patientId) return;
    
    setLoading(true);
    
    // Get total count
    const { count } = await supabase
      .from("allergies")
      .select("*", { count: "exact", head: true })
      .eq("patient_id", patientId);
    
    setTotalCount(count || 0);
    
    // Get paginated data
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from("allergies")
      .select("*, verified_by:profiles!allergies_verified_by_fkey(first_name, last_name)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading allergies",
        description: error.message,
      });
    } else {
      setAllergies(data || []);
    }
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      mild: "bg-yellow-500",
      moderate: "bg-orange-500",
      severe: "bg-red-500",
      life_threatening: "bg-red-700",
    };
    return colors[severity] || "bg-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Allergies
          </CardTitle>
          {patientId && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Allergy
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : allergies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No known allergies recorded.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Allergen</TableHead>
                <TableHead>Reaction</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Onset Date</TableHead>
                <TableHead>Verified By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allergies.map((allergy) => (
                <TableRow key={allergy.id} className={allergy.severity === 'severe' || allergy.severity === 'life_threatening' ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                  <TableCell className="font-medium">
                    {allergy.allergen}
                  </TableCell>
                  <TableCell>{allergy.reaction}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(allergy.severity)}>
                      {allergy.severity.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {allergy.onset_date ? new Date(allergy.onset_date).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    {allergy.verified_by ? (
                      `${allergy.verified_by.first_name} ${allergy.verified_by.last_name}`
                    ) : (
                      <span className="text-muted-foreground">Not verified</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {allergy.notes || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {!loading && allergies.length > 0 && (
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

      <AddAllergyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patientId={patientId}
        onSuccess={loadAllergies}
      />
    </Card>
  );
}
