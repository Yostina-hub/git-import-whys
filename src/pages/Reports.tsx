import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StatsCards } from "@/components/reports/StatsCards";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { AppointmentChart } from "@/components/reports/AppointmentChart";
import { PatientDemographics } from "@/components/reports/PatientDemographics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    activeSessions: 0,
    pendingInvoices: 0,
    completedToday: 0,
  });
  const [revenueData, setRevenueData] = useState<Array<{ date: string; revenue: number; outstanding: number }>>([]);
  const [appointmentData, setAppointmentData] = useState<Array<{ date: string; booked: number; completed: number; cancelled: number }>>([]);
  const [demographicsData, setDemographicsData] = useState<Array<{ name: string; value: number }>>([]);

  useEffect(() => {
    checkAuth();
    loadStats();
    loadRevenueData();
    loadAppointmentData();
    loadDemographicsData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const [patientsRes, appointmentsRes, revenueRes, sessionsRes, pendingRes, completedRes] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact" }),
        supabase.from("appointments").select("*", { count: "exact" }),
        supabase.from("invoices").select("total_amount"),
        supabase.from("treatment_sessions" as any).select("*", { count: "exact" }).gte("performed_at", today),
        supabase.from("invoices").select("*", { count: "exact" }).in("status", ["issued", "partial"]),
        supabase.from("appointments").select("*", { count: "exact" }).eq("status", "completed").gte("scheduled_start", today),
      ]);

      const revenue = revenueRes.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      setStats({
        totalPatients: patientsRes.count || 0,
        totalAppointments: appointmentsRes.count || 0,
        totalRevenue: revenue,
        activeSessions: sessionsRes.count || 0,
        pendingInvoices: pendingRes.count || 0,
        completedToday: completedRes.count || 0,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading statistics",
        description: error.message,
      });
    }
    setLoading(false);
  };

  const loadRevenueData = async () => {
    try {
      const { data, error } = await supabase
        .from("revenue_analytics" as any)
        .select("*")
        .order("report_date", { ascending: true })
        .limit(30);

      if (error) throw error;

      const chartData = (data || []).map((row: any) => ({
        date: format(new Date(row.report_date), 'MMM dd'),
        revenue: Number(row.total_revenue) || 0,
        outstanding: Number(row.outstanding_balance) || 0,
      }));

      setRevenueData(chartData);
    } catch (error: any) {
      console.error("Error loading revenue data:", error);
    }
  };

  const loadAppointmentData = async () => {
    try {
      const { data, error } = await supabase
        .from("appointment_analytics" as any)
        .select("*")
        .order("report_date", { ascending: true })
        .limit(30);

      if (error) throw error;

      const grouped = (data || []).reduce((acc: any, row: any) => {
        const date = format(new Date(row.report_date), 'MMM dd');
        if (!acc[date]) {
          acc[date] = { date, booked: 0, completed: 0, cancelled: 0 };
        }
        if (row.status === 'booked') acc[date].booked += row.appointment_count;
        if (row.status === 'completed') acc[date].completed += row.appointment_count;
        if (row.status === 'cancelled') acc[date].cancelled += row.appointment_count;
        return acc;
      }, {});

      setAppointmentData(Object.values(grouped));
    } catch (error: any) {
      console.error("Error loading appointment data:", error);
    }
  };

  const loadDemographicsData = async () => {
    try {
      const { data, error } = await supabase
        .from("patient_demographics" as any)
        .select("*")
        .limit(10);

      if (error) throw error;

      const chartData = (data || [])
        .filter((row: any) => row.gender_identity)
        .map((row: any) => ({
          name: row.gender_identity || 'Unknown',
          value: row.patient_count || 0,
        }));

      setDemographicsData(chartData);
    } catch (error: any) {
      console.error("Error loading demographics data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading report data...
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            <StatsCards stats={stats} />

            <Tabs defaultValue="revenue" className="space-y-4">
              <TabsList>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="demographics">Demographics</TabsTrigger>
              </TabsList>

              <TabsContent value="revenue">
                <RevenueChart data={revenueData} />
              </TabsContent>

              <TabsContent value="appointments">
                <AppointmentChart data={appointmentData} />
              </TabsContent>

              <TabsContent value="demographics">
                <PatientDemographics data={demographicsData} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
