import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Stethoscope, Activity, Clock } from "lucide-react";

export function ClinicianDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    myPatients: 0,
    todayAppointments: 0,
    pendingOrders: 0,
    activeSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClinicianStats();
  }, []);

  const loadClinicianStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

      const [patients, appointments, orders, sessions] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", user.id)
          .gte("scheduled_start", today)
          .lt("scheduled_start", tomorrow),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("ordered_by", user.id)
          .in("status", ["draft", "in_progress"]),
        supabase
          .from("treatment_sessions")
          .select("id", { count: "exact", head: true })
          .eq("clinician_id", user.id)
          .gte("performed_at", today),
      ]);

      setStats({
        myPatients: patients.count || 0,
        todayAppointments: appointments.count || 0,
        pendingOrders: orders.count || 0,
        activeSessions: sessions.count || 0,
      });
    } catch (error) {
      console.error("Error loading clinician stats:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clinician Dashboard</h1>
        <p className="text-muted-foreground">Your patients and clinical activities</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Patients</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.myPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">In my clinic(s)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Schedule</CardTitle>
            <Calendar className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayAppointments}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>Appointments today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
            <Activity className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">Today</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            <Stethoscope className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting results</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-primary" onClick={() => navigate("/patients")}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>My Patients</CardTitle>
                <CardDescription>View and manage patient records</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-blue-500" onClick={() => navigate("/appointments")}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>Today's schedule and upcoming visits</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-purple-500" onClick={() => navigate("/orders")}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-8 w-8 text-purple-500" />
              <div>
                <CardTitle>Orders & Results</CardTitle>
                <CardDescription>Lab, imaging, and referrals</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
