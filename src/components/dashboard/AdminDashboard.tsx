import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, Building2, FileText, Settings, TrendingUp, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatsGrid } from "./StatsGrid";
import { RecentActivity } from "./RecentActivity";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    activeClinics: 0,
    activeUsers: 0,
    todayAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      const [patients, appointments, invoices, clinics, users, todayAppts] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("total_amount"),
        supabase.from("clinics").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .gte("scheduled_start", new Date().toISOString().split("T")[0])
          .lt("scheduled_start", new Date(Date.now() + 86400000).toISOString().split("T")[0]),
      ]);

      const revenue = invoices.data?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

      setStats({
        totalPatients: patients.count || 0,
        totalAppointments: appointments.count || 0,
        totalRevenue: revenue,
        activeClinics: clinics.count || 0,
        activeUsers: users.count || 0,
        todayAppointments: todayAppts.count || 0,
      });
    } catch (error) {
      console.error("Error loading admin stats:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <StatsGrid
        stats={{
          totalPatients: stats.totalPatients,
          todayAppointments: stats.todayAppointments,
          pendingAppointments: 6,
          activeTreatments: 156,
          avgWaitTime: 12,
          patientsChange: 12,
          treatmentsChange: 8,
          waitTimeChange: -3,
        }}
      />

      {/* Recent Activity */}
      <RecentActivity />

      {/* Quick Actions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">Total collected</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appointments</CardTitle>
            <Calendar className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled today</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clinics</CardTitle>
            <Building2 className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeClinics}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.activeUsers} active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-primary" onClick={() => navigate("/admin")}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>System Administration</CardTitle>
                <CardDescription>User management, roles, audit logs</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-purple-500" onClick={() => navigate("/resources")}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-purple-500" />
              <div>
                <CardTitle>Clinic & Resources</CardTitle>
                <CardDescription>Manage clinics, providers, schedules</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-cyan-500" onClick={() => navigate("/reports")}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-cyan-500" />
              <div>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>Business intelligence and insights</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
