import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Activity } from "lucide-react";
import { AddVitalSignDialog } from "./AddVitalSignDialog";

interface VitalSignsTabProps {
  patientId: string | null;
}

export function VitalSignsTab({ patientId }: VitalSignsTabProps) {
  const { toast } = useToast();
  const [vitals, setVitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (patientId) {
      loadVitals();
    }
  }, [patientId]);

  const loadVitals = async () => {
    if (!patientId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("vital_signs")
      .select("*, recorded_by:profiles!vital_signs_recorded_by_fkey(first_name, last_name)")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading vital signs",
        description: error.message,
      });
    } else {
      setVitals(data || []);
    }
    setLoading(false);
  };

  const getBMICategory = (bmi: number | null) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: "Underweight", color: "bg-blue-500" };
    if (bmi < 25) return { label: "Normal", color: "bg-green-500" };
    if (bmi < 30) return { label: "Overweight", color: "bg-yellow-500" };
    return { label: "Obese", color: "bg-red-500" };
  };

  const getBPCategory = (systolic: number | null, diastolic: number | null) => {
    if (!systolic || !diastolic) return null;
    if (systolic < 120 && diastolic < 80) return { label: "Normal", color: "bg-green-500" };
    if (systolic < 130 && diastolic < 80) return { label: "Elevated", color: "bg-yellow-500" };
    if (systolic < 140 || diastolic < 90) return { label: "Stage 1", color: "bg-orange-500" };
    return { label: "Stage 2", color: "bg-red-500" };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vital Signs</CardTitle>
          {patientId && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Vitals
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : vitals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No vital signs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>BP</TableHead>
                  <TableHead>HR</TableHead>
                  <TableHead>Temp</TableHead>
                  <TableHead>SpO2</TableHead>
                  <TableHead>RR</TableHead>
                  <TableHead>Height/Weight</TableHead>
                  <TableHead>BMI</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vitals.map((vital) => {
                  const bmiCat = getBMICategory(vital.bmi);
                  const bpCat = getBPCategory(vital.blood_pressure_systolic, vital.blood_pressure_diastolic);
                  
                  return (
                    <TableRow key={vital.id}>
                      <TableCell className="font-medium">
                        {new Date(vital.recorded_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {vital.blood_pressure_systolic && vital.blood_pressure_diastolic ? (
                          <div className="flex items-center gap-2">
                            <span>{vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}</span>
                            {bpCat && (
                              <Badge className={bpCat.color}>{bpCat.label}</Badge>
                            )}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{vital.heart_rate ? `${vital.heart_rate} bpm` : '—'}</TableCell>
                      <TableCell>
                        {vital.temperature ? `${vital.temperature}°${vital.temperature_unit === 'celsius' ? 'C' : 'F'}` : '—'}
                      </TableCell>
                      <TableCell>{vital.oxygen_saturation ? `${vital.oxygen_saturation}%` : '—'}</TableCell>
                      <TableCell>{vital.respiratory_rate ? `${vital.respiratory_rate}/min` : '—'}</TableCell>
                      <TableCell>
                        {vital.height || vital.weight ? (
                          <div className="text-sm">
                            {vital.height && `${vital.height} ${vital.height_unit}`}
                            {vital.height && vital.weight && ' / '}
                            {vital.weight && `${vital.weight} ${vital.weight_unit}`}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {vital.bmi ? (
                          <div className="flex items-center gap-2">
                            <span>{Number(vital.bmi).toFixed(1)}</span>
                            {bmiCat && (
                              <Badge className={bmiCat.color}>{bmiCat.label}</Badge>
                            )}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {vital.recorded_by?.first_name} {vital.recorded_by?.last_name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {vital.notes || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AddVitalSignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patientId={patientId}
        onSuccess={loadVitals}
      />
    </Card>
  );
}
