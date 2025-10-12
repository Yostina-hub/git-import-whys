import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, CalendarOff } from "lucide-react";
import { ManageHolidayDialog } from "./ManageHolidayDialog";

interface Holiday {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  clinic_id: string | null;
  is_recurring: boolean;
  created_at: string;
}

export function HolidaysTab() {
  const { toast } = useToast();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    // For now, we'll use a placeholder since the holidays table doesn't exist yet
    // In a real implementation, this would query a holidays table
    setHolidays([]);
    setLoading(false);
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingHoliday(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Holidays & Clinic Closures</CardTitle>
            <CardDescription>
              Manage clinic-wide holidays and closure dates
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Holiday
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Holidays Configured</h3>
            <p className="max-w-md mx-auto mb-4">
              Define clinic-wide holidays, closure dates, and recurring annual holidays. 
              The system will automatically block appointments during these periods.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Holiday
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Holiday Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">{holiday.name}</TableCell>
                  <TableCell>{new Date(holiday.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(holiday.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={holiday.is_recurring ? "bg-blue-500" : "bg-gray-500"}>
                      {holiday.is_recurring ? "Recurring" : "One-time"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {holiday.clinic_id ? "Specific Clinic" : "All Clinics"}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(holiday)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ManageHolidayDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        holiday={editingHoliday}
        onSuccess={loadHolidays}
      />
    </Card>
  );
}
