import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, List, UserPlus, Clock, CheckCircle } from "lucide-react";

export function ReceptionDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    waitingQueue: 0,
    checkedIn: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceptionStats();
  }, []);

  const loadReceptionStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

      const [patients, appointments, waiting, checkedIn] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .gte("scheduled_start", today)
          .lt("scheduled_start", tomorrow),
        supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("status", "waiting"),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .gte("scheduled_start", today)
          .lt("scheduled_start", tomorrow)
          .eq("status", "arrived"),
      ]);

      setStats({
        totalPatients: patients.count || 0,
        todayAppointments: appointments.count || 0,
        waitingQueue: waiting.count || 0,
        checkedIn: checkedIn.count || 0,
      });
    } catch (error) {
      console.error("Error loading reception stats:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reception Dashboard</h1>
        <p className="text-muted-foreground">Patient registration and appointment management</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Appointments</CardTitle>
            <Calendar className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayAppointments}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>{stats.checkedIn} checked in</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waiting Queue</CardTitle>
            <List className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.waitingQueue}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>Currently waiting</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Check-in Rate</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.todayAppointments > 0 
                ? Math.round((stats.checkedIn / stats.todayAppointments) * 100) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Arrival rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-primary" onClick={() => navigate("/patients")}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Register Patient</CardTitle>
                <CardDescription>Add new patient records</CardDescription>
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
                <CardDescription>Schedule and manage visits</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-orange-500" onClick={() => navigate("/queue")}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <List className="h-8 w-8 text-orange-500" />
              <div>
                <CardTitle>Queue Management</CardTitle>
                <CardDescription>Monitor patient flow</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
