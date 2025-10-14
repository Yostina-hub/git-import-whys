import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

interface DoctorAnalyticsProps {
  doctors: Doctor[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const DoctorAnalytics = ({ doctors }: DoctorAnalyticsProps) => {
  const { data: analyticsData } = useQuery({
    queryKey: ['doctor-analytics'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const doctorStats = await Promise.all(
        doctors.map(async (doctor) => {
          const { count } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', doctor.id)
            .gte('scheduled_start', thirtyDaysAgo.toISOString());

          return {
            name: `Dr. ${doctor.last_name}`,
            appointments: count || 0
          };
        })
      );

      return doctorStats.sort((a, b) => b.appointments - a.appointments);
    },
    enabled: doctors.length > 0
  });

  const { data: statusDistribution } = useQuery({
    queryKey: ['appointment-status-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('status')
        .gte('scheduled_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const distribution = data?.reduce((acc: any, apt) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(distribution || {}).map(([name, value]) => ({
        name,
        value
      }));
    }
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Doctor Workload Comparison</CardTitle>
          <CardDescription>Appointments handled in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analyticsData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="appointments" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Appointment Status Distribution</CardTitle>
          <CardDescription>Overview of appointment outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={statusDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
