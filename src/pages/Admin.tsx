import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Settings, Activity, Database, Users, Shield, RefreshCw, BarChart3 } from "lucide-react";
import { AuditLogsTab } from "@/components/admin/AuditLogsTab";
import { SystemSettingsTab } from "@/components/admin/SystemSettingsTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";
import { UserManagementTab } from "@/components/admin/UserManagementTab";
import { PermissionsTab } from "@/components/admin/PermissionsTab";
import { AdminStats } from "@/components/admin/AdminStats";
import { AIAccessManagement } from "@/components/admin/AIAccessManagement";
import { AIUsageStats } from "@/components/admin/AIUsageStats";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalActions: 0,
    systemHealth: 98,
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user has admin or manager role
    const { data: roles } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", session.user.id);

    const hasAdminAccess = roles?.some(
      (r: any) => r.role === "admin" || r.role === "manager"
    );

    if (!hasAdminAccess) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You don't have permission to access this page",
      });
      navigate("/dashboard");
      return;
    }

    setHasAccess(true);
    setLoading(false);
    loadAdminStats();
  };

  const loadAdminStats = async () => {
    try {
      // Load total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Load active users (users with last_login in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_login", thirtyDaysAgo.toISOString());

      // Load total actions from activity_summary
      const { data: activityData } = await supabase
        .from("activity_summary")
        .select("actions_count");
      
      const totalActions = activityData?.reduce((sum, row) => sum + (row.actions_count || 0), 0) || 0;

      setAdminStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalActions,
        systemHealth: 98, // This could be calculated based on various metrics
      });
    } catch (error) {
      console.error("Error loading admin stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading administration panel...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/dashboard")}
                className="hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    System Administration
                  </h1>
                  <p className="text-sm text-muted-foreground">Manage system settings, users, and analytics</p>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadAdminStats}
              className="gap-2 hover:bg-primary/10 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Admin Stats */}
        <AdminStats
          totalUsers={adminStats.totalUsers}
          activeUsers={adminStats.activeUsers}
          totalActions={adminStats.totalActions}
          systemHealth={adminStats.systemHealth}
        />

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-7 p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger 
              value="analytics"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="permissions"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger 
              value="audit"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Activity className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger 
              value="ai-access"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all duration-300"
            >
              AI Access
            </TabsTrigger>
            <TabsTrigger 
              value="ai-usage"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white transition-all duration-300"
            >
              AI Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
              <CardContent className="pt-6">
                <AnalyticsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-green-500/5">
              <CardContent className="pt-6">
                <UserManagementTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-cyan-500/5">
              <CardContent className="pt-6">
                <PermissionsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-orange-500/5">
              <CardContent className="pt-6">
                <AuditLogsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-purple-500/5">
              <CardContent className="pt-6">
                <SystemSettingsTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-access">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-rose-500/5">
              <CardContent className="pt-6">
                <AIAccessManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-usage">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-indigo-500/5">
              <CardContent className="pt-6">
                <AIUsageStats />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
