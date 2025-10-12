import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { StatsCards } from "@/components/reports/StatsCards";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    newPatientsThisMonth: 0,
    appointmentsToday: 0,
    appointmentsThisWeek: 0,
    revenue30d: 0,
    revenueGrowth: 0,
    outstanding: 0,
    outstandingInvoices: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadReportData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadReportData = async () => {
    setLoading(true);

    try {
      // Get patient stats
      const { count: totalPatients } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: newPatientsThisMonth } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Get appointment stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: appointmentsToday } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("scheduled_start", today.toISOString());

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count: appointmentsThisWeek } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("scheduled_start", weekAgo.toISOString());

      // Get revenue stats
      const { data: payments30d } = await supabase
        .from("payments")
        .select("amount")
        .gte("received_at", thirtyDaysAgo.toISOString());

      const revenue30d = payments30d?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Get outstanding invoices
      const { data: outstandingInvoices } = await supabase
        .from("invoices")
        .select("balance_due")
        .gt("balance_due", 0)
        .neq("status", "void");

      const outstanding = outstandingInvoices?.reduce((sum, inv) => sum + Number(inv.balance_due), 0) || 0;

      // Get revenue trend for last 7 days
      const revenueByDay = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const { data: dayPayments } = await supabase
          .from("payments")
          .select("amount")
          .gte("received_at", date.toISOString())
          .lt("received_at", nextDay.toISOString());

        const revenue = dayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        revenueByDay.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          revenue,
        });
      }

      setStats({
        totalPatients: totalPatients || 0,
        newPatientsThisMonth: newPatientsThisMonth || 0,
        appointmentsToday: appointmentsToday || 0,
        appointmentsThisWeek: appointmentsThisWeek || 0,
        revenue30d,
        revenueGrowth: 12, // Placeholder
        outstanding,
        outstandingInvoices: outstandingInvoices?.length || 0,
      });

      setRevenueData(revenueByDay);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading report data",
        description: error.message,
      });
    }

    setLoading(false);
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
        {!loading && (
          <div className="space-y-6">
            <StatsCards stats={stats} />
            <RevenueChart data={revenueData} />
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading report data...
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
