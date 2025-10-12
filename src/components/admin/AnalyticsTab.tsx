import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, Activity } from "lucide-react";

export const AnalyticsTab = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);

    // Get total patients
    const { count: patients } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true });

    // Get total appointments
    const { count: appointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true });

    // Get total revenue
    const { data: invoices } = await supabase
      .from("invoices")
      .select("total_amount");

    const revenue = invoices?.reduce(
      (sum, inv) => sum + (Number(inv.total_amount) || 0),
      0
    ) || 0;

    // Get active users (users with roles)
    const { count: activeUsers } = await supabase
      .from("user_roles" as any)
      .select("user_id", { count: "exact", head: true });

    setStats({
      totalPatients: patients || 0,
      totalAppointments: appointments || 0,
      totalRevenue: revenue,
      activeUsers: activeUsers || 0,
    });

    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From all invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Staff accounts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Patient Growth</span>
              <span className="text-sm text-muted-foreground">
                Track patient registration trends
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Appointment Utilization</span>
              <span className="text-sm text-muted-foreground">
                Monitor booking efficiency
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Revenue Trends</span>
              <span className="text-sm text-muted-foreground">
                Analyze financial performance
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
