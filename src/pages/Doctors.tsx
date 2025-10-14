import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoctorsList } from "@/components/doctors/DoctorsList";
import { DoctorPerformance } from "@/components/doctors/DoctorPerformance";
import { DoctorAnalytics } from "@/components/doctors/DoctorAnalytics";
import { AIInsightsPanel } from "@/components/doctors/AIInsightsPanel";
import { Stethoscope, TrendingUp, BarChart3, Sparkles } from "lucide-react";

const Doctors = () => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone_mobile,
          status
        `)
        .eq('status', 'active');
      
      if (error) throw error;

      // Filter to get only clinicians
      const { data: clinicians } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'clinician')
        .in('user_id', data.map(d => d.id));

      const clinicianIds = new Set(clinicians?.map(c => c.user_id) || []);
      return data.filter(d => clinicianIds.has(d.id));
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['doctor-stats'],
    queryFn: async () => {
      const { count: totalDoctors } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'clinician');

      const { count: activeAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      const { count: completedToday } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('scheduled_start', new Date().toISOString().split('T')[0]);

      return {
        totalDoctors: totalDoctors || 0,
        activeAppointments: activeAppointments || 0,
        completedToday: completedToday || 0
      };
    }
  });

  return (
    <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Doctors & Providers
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage clinicians and analyze performance with AI insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalDoctors || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active clinicians</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Consultations</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.activeAppointments || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.completedToday || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Appointments finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ai-insights">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Active Doctors</CardTitle>
                <CardDescription>
                  View and manage all clinicians in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DoctorsList 
                  doctors={doctors || []}
                  isLoading={isLoading}
                  onSelectDoctor={setSelectedDoctorId}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <DoctorPerformance 
              doctors={doctors || []}
              selectedDoctorId={selectedDoctorId}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <DoctorAnalytics doctors={doctors || []} />
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <AIInsightsPanel 
              doctors={doctors || []}
              selectedDoctorId={selectedDoctorId}
            />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Doctors;
