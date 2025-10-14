import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Calendar, Users, Clock, TrendingUp } from "lucide-react";

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

interface DoctorPerformanceProps {
  doctors: Doctor[];
  selectedDoctorId: string | null;
}

export const DoctorPerformance = ({ doctors, selectedDoctorId }: DoctorPerformanceProps) => {
  const { data: performanceData } = useQuery({
    queryKey: ['doctor-performance', selectedDoctorId],
    queryFn: async () => {
      if (!selectedDoctorId) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('provider_id', selectedDoctorId)
        .gte('scheduled_start', thirtyDaysAgo.toISOString());

      if (error) throw error;

      const completed = appointments?.filter(a => a.status === 'completed').length || 0;
      const total = appointments?.length || 0;
      const avgDuration = appointments?.length 
        ? appointments.reduce((sum, a) => {
            const start = new Date(a.scheduled_start);
            const end = new Date(a.scheduled_end);
            return sum + (end.getTime() - start.getTime()) / (1000 * 60);
          }, 0) / appointments.length
        : 0;

      return {
        totalAppointments: total,
        completedAppointments: completed,
        completionRate: total > 0 ? (completed / total * 100).toFixed(1) : '0',
        avgDuration: avgDuration.toFixed(0),
        appointments
      };
    },
    enabled: !!selectedDoctorId
  });

  const chartData = performanceData?.appointments?.reduce((acc: any[], apt) => {
    const date = new Date(apt.scheduled_start).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Select Doctor</CardTitle>
          <CardDescription>Choose a doctor to view their performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedDoctorId || ''} onValueChange={(value) => {}}>
            <SelectTrigger>
              <SelectValue placeholder="Select a doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  Dr. {doc.first_name} {doc.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedDoctorId && performanceData && (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.totalAppointments}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.completedAppointments}</div>
                <p className="text-xs text-muted-foreground">Successful consultations</p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.completionRate}%</div>
                <p className="text-xs text-muted-foreground">Success ratio</p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.avgDuration} min</div>
                <p className="text-xs text-muted-foreground">Per appointment</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Appointment Trend</CardTitle>
              <CardDescription>Daily appointment volume over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
