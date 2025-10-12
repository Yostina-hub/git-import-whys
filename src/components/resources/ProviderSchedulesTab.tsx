import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Clock, CalendarOff, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { ManageScheduleDialog } from "./ManageScheduleDialog";
import { RequestTimeOffDialog } from "./RequestTimeOffDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export function ProviderSchedulesTab() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadSchedules(), loadExceptions()]);
  };

  const loadSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("provider_schedules")
      .select(`
        *,
        provider:profiles!provider_schedules_provider_id_fkey(first_name, last_name),
        clinic:clinics(name)
      `)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading schedules",
        description: error.message,
      });
    } else {
      setSchedules(data || []);
    }
    setLoading(false);
  };

  const loadExceptions = async () => {
    const { data, error } = await supabase
      .from("schedule_exceptions")
      .select(`
        *,
        provider:profiles!schedule_exceptions_provider_id_fkey(first_name, last_name)
      `)
      .order("exception_date", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading exceptions",
        description: error.message,
      });
    } else {
      setExceptions(data || []);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    const { error } = await supabase
      .from("provider_schedules")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting schedule",
        description: error.message,
      });
    } else {
      toast({ title: "Success", description: "Schedule deleted successfully" });
      loadSchedules();
    }
  };

  const handleApproveException = async (id: string) => {
    const { error } = await supabase
      .from("schedule_exceptions")
      .update({ 
        status: "approved",
        approved_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error approving request",
        description: error.message,
      });
    } else {
      toast({ title: "Success", description: "Time-off request approved" });
      loadExceptions();
    }
  };

  const handleRejectException = async (id: string) => {
    const { error } = await supabase
      .from("schedule_exceptions")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error rejecting request",
        description: error.message,
      });
    } else {
      toast({ title: "Success", description: "Time-off request rejected" });
      loadExceptions();
    }
  };

  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Provider Schedules</CardTitle>
            <CardDescription>
              Manage working hours and availability for clinicians
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setTimeOffDialogOpen(true)} variant="outline">
              <CalendarOff className="h-4 w-4 mr-2" />
              Request Time Off
            </Button>
            <Button onClick={() => {
              setEditingSchedule(null);
              setScheduleDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="schedules" className="w-full">
          <TabsList>
            <TabsTrigger value="schedules">
              <Clock className="h-4 w-4 mr-2" />
              Regular Schedules
            </TabsTrigger>
            <TabsTrigger value="exceptions">
              <CalendarOff className="h-4 w-4 mr-2" />
              Time-Off Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Schedules Yet</h3>
                <p className="mb-4">Create your first provider schedule to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Break</TableHead>
                    <TableHead>Max Appointments</TableHead>
                    <TableHead>Effective Period</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        {schedule.provider.first_name} {schedule.provider.last_name}
                      </TableCell>
                      <TableCell>{schedule.clinic.name}</TableCell>
                      <TableCell>{getDayLabel(schedule.day_of_week)}</TableCell>
                      <TableCell>
                        {schedule.start_time} - {schedule.end_time}
                      </TableCell>
                      <TableCell>
                        {schedule.break_start && schedule.break_end
                          ? `${schedule.break_start} - ${schedule.break_end}`
                          : "None"}
                      </TableCell>
                      <TableCell>{schedule.max_appointments}</TableCell>
                      <TableCell>
                        {format(new Date(schedule.effective_from), "MMM dd, yyyy")}
                        {schedule.effective_until && ` - ${format(new Date(schedule.effective_until), "MMM dd, yyyy")}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingSchedule(schedule);
                              setScheduleDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="exceptions">
            {exceptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Time-Off Requests</h3>
                <p className="mb-4">Time-off requests will appear here</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exceptions.map((exception) => (
                    <TableRow key={exception.id}>
                      <TableCell className="font-medium">
                        {exception.provider.first_name} {exception.provider.last_name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(exception.exception_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {exception.exception_type === "leave" ? "Full Day" : "Partial"}
                      </TableCell>
                      <TableCell>
                        {exception.start_time && exception.end_time
                          ? `${exception.start_time} - ${exception.end_time}`
                          : "All Day"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {exception.reason}
                      </TableCell>
                      <TableCell>{getStatusBadge(exception.status)}</TableCell>
                      <TableCell className="text-right">
                        {exception.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveException(exception.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectException(exception.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <ManageScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        schedule={editingSchedule}
        onSuccess={loadSchedules}
      />

      <RequestTimeOffDialog
        open={timeOffDialogOpen}
        onOpenChange={setTimeOffDialogOpen}
        onSuccess={loadExceptions}
      />
    </Card>
  );
}
