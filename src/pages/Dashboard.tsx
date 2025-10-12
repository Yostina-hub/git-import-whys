import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Users, Calendar, FileText, List, Stethoscope, Mail, DollarSign, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsGrid } from "@/components/dashboard/StatsGrid";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    revenue: 0,
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
      
      // Check if user is admin or manager
      const { data: roles } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", session.user.id);
      
      const hasAdminAccess = roles?.some(
        (r: any) => r.role === "admin" || r.role === "manager"
      );
      setIsAdmin(hasAdminAccess || false);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const [patientsRes, appointmentsRes, invoicesRes] = await Promise.all([
      supabase.from("patients").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id", { count: "exact", head: true }),
      supabase.from("invoices").select("total_amount"),
    ]);

    const revenue = invoicesRes.data?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

    setStats({
      patients: patientsRes.count || 0,
      appointments: appointmentsRes.count || 0,
      revenue,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar isAdmin={isAdmin} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader
            user={user}
            onLogout={handleLogout}
            onProfileClick={() => navigate("/profile")}
          />

          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening today.
              </p>
            </div>

            <StatsGrid stats={stats} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card
                className="group hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary hover:border-l-primary/80"
                onClick={() => navigate("/patients")}
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Users className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-2xl font-bold text-muted-foreground">{stats.patients}</span>
                  </div>
                  <h3 className="font-semibold text-lg">Patient Management</h3>
                  <CardDescription>
                    Register, search, and manage patient records with comprehensive demographics
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="group hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500 hover:border-l-blue-400"
                onClick={() => navigate("/appointments")}
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Calendar className="h-10 w-10 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-2xl font-bold text-muted-foreground">{stats.appointments}</span>
                  </div>
                  <h3 className="font-semibold text-lg">Appointments</h3>
                  <CardDescription>
                    Schedule, manage, and track patient appointments with real-time updates
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="group hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-purple-500 hover:border-l-purple-400"
                onClick={() => navigate("/clinical")}
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <FileText className="h-10 w-10 text-purple-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-lg">Clinical Records</h3>
                  <CardDescription>
                    Manage assessments, treatment protocols, sessions, and EMR notes
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="group hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-green-500 hover:border-l-green-400"
                onClick={() => navigate("/billing")}
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <DollarSign className="h-10 w-10 text-green-500 group-hover:scale-110 transition-transform" />
                    <span className="text-2xl font-bold text-muted-foreground">
                      ${stats.revenue.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">Billing & Payments</h3>
                  <CardDescription>
                    Create invoices, record payments, and manage financial transactions
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="group hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-orange-500 hover:border-l-orange-400"
                onClick={() => navigate("/queue")}
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <List className="h-10 w-10 text-orange-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-lg">Queue Management</h3>
                  <CardDescription>
                    Monitor patient flow, manage queues, and track wait times
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="group hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-indigo-500 hover:border-l-indigo-400"
                onClick={() => navigate("/orders")}
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Stethoscope className="h-10 w-10 text-indigo-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-lg">Lab & Imaging Orders</h3>
                  <CardDescription>
                    Create and track lab tests, imaging studies, and referrals
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="group hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-pink-500 hover:border-l-pink-400"
                onClick={() => navigate("/communications")}
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Mail className="h-10 w-10 text-pink-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-lg">Communications</h3>
                  <CardDescription>
                    Send notifications, messages, and manage patient communications
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="group hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-cyan-500 hover:border-l-cyan-400"
                onClick={() => navigate("/reports")}
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <ClipboardList className="h-10 w-10 text-cyan-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-lg">Analytics & Reports</h3>
                  <CardDescription>
                    View comprehensive analytics, reports, and business intelligence
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
