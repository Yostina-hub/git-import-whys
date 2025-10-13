import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { AdvancedStatsGrid } from "@/components/reports/AdvancedStatsGrid";
import { EnhancedRevenueChart } from "@/components/reports/EnhancedRevenueChart";
import { EnhancedAppointmentChart } from "@/components/reports/EnhancedAppointmentChart";
import { EnhancedDemographicsChart } from "@/components/reports/EnhancedDemographicsChart";
import { PaymentReportsCard } from "@/components/reports/PaymentReportsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfWeek, startOfMonth, subMonths, startOfYear } from "date-fns";

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
  const [paymentData, setPaymentData] = useState<Array<{ date: string; amount: number; count: number }>>([]);
  const [paymentPeriod, setPaymentPeriod] = useState<'daily' | 'weekly' | 'monthly' | '3month' | 'yearly'>('monthly');

  useEffect(() => {
    checkAuth();
    loadStats();
    loadRevenueData();
    loadAppointmentData();
    loadDemographicsData();
    loadPaymentData();
  }, []);

  useEffect(() => {
    loadPaymentData();
  }, [paymentPeriod]);

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

  const loadPaymentData = async () => {
    try {
      let startDate: Date;
      const today = new Date();

      switch (paymentPeriod) {
        case 'daily':
          startDate = subDays(today, 7);
          break;
        case 'weekly':
          startDate = subDays(today, 28);
          break;
        case 'monthly':
          startDate = subMonths(today, 6);
          break;
        case '3month':
          startDate = subMonths(today, 12);
          break;
        case 'yearly':
          startDate = subMonths(today, 24);
          break;
        default:
          startDate = subMonths(today, 6);
      }

      const { data, error } = await supabase
        .from("payments")
        .select("amount, received_at")
        .gte("received_at", startDate.toISOString())
        .order("received_at", { ascending: true });

      if (error) throw error;

      // Group payments by period
      const grouped = (data || []).reduce((acc: any, payment: any) => {
        let key: string;
        const date = new Date(payment.received_at);

        switch (paymentPeriod) {
          case 'daily':
            key = format(date, 'MMM dd');
            break;
          case 'weekly':
            key = format(startOfWeek(date), 'MMM dd');
            break;
          case 'monthly':
            key = format(startOfMonth(date), 'MMM yyyy');
            break;
          case '3month':
          case 'yearly':
            key = format(startOfMonth(date), 'MMM yyyy');
            break;
          default:
            key = format(date, 'MMM dd');
        }

        if (!acc[key]) {
          acc[key] = { date: key, amount: 0, count: 0 };
        }
        acc[key].amount += Number(payment.amount) || 0;
        acc[key].count += 1;
        return acc;
      }, {});

      setPaymentData(Object.values(grouped));
    } catch (error: any) {
      console.error("Error loading payment data:", error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadStats();
    loadRevenueData();
    loadAppointmentData();
    loadDemographicsData();
    loadPaymentData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Comprehensive insights and performance metrics</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="space-y-8 animate-fade-in">
            <AdvancedStatsGrid stats={stats} />

            <PaymentReportsCard 
              payments={paymentData} 
              period={paymentPeriod}
              onPeriodChange={setPaymentPeriod}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnhancedRevenueChart data={revenueData} />
              <EnhancedAppointmentChart data={appointmentData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnhancedDemographicsChart data={demographicsData} />
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border-2 border-primary/20">
                <h3 className="text-xl font-bold mb-4">Key Insights</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center mt-1">
                      <span className="text-[hsl(var(--success))] font-bold">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Strong Performance</h4>
                      <p className="text-sm text-muted-foreground">Revenue trending positively with {stats.completedToday} appointments completed today</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-info/20 flex items-center justify-center mt-1">
                      <span className="text-[hsl(var(--info))] font-bold">i</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Active Sessions</h4>
                      <p className="text-sm text-muted-foreground">{stats.activeSessions} active treatment sessions in progress</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center mt-1">
                      <span className="text-[hsl(var(--warning))] font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Pending Invoices</h4>
                      <p className="text-sm text-muted-foreground">{stats.pendingInvoices} invoices require attention</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
