import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, MessageSquare, Mail, Bell } from "lucide-react";
import { NotificationTemplates } from "@/components/communications/NotificationTemplates";
import { NotificationsLog } from "@/components/communications/NotificationsLog";
import { SendNotificationDialog } from "@/components/communications/SendNotificationDialog";

const Communications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSent: 0,
    pendingScheduled: 0,
    failedToday: 0,
  });

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadStats = async () => {
    setLoading(true);

    // Get total sent notifications
    const { count: totalSent } = await supabase
      .from("notifications_log" as any)
      .select("*", { count: "exact", head: true })
      .eq("status", "sent");

    // Get pending scheduled notifications
    const { count: pendingScheduled } = await supabase
      .from("scheduled_notifications" as any)
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Get failed notifications today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: failedToday } = await supabase
      .from("notifications_log" as any)
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", today.toISOString());

    setStats({
      totalSent: totalSent || 0,
      pendingScheduled: pendingScheduled || 0,
      failedToday: failedToday || 0,
    });

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Communications</h1>
              <p className="text-muted-foreground">Manage notifications and patient communications</p>
            </div>
            <SendNotificationDialog onSent={loadStats} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent}</div>
              <p className="text-xs text-muted-foreground">All time notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingScheduled}</div>
              <p className="text-xs text-muted-foreground">Pending delivery</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Failed Today</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.failedToday}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="log" className="w-full">
          <TabsList>
            <TabsTrigger value="log">Notifications Log</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="log">
            <Card>
              <CardContent className="pt-6">
                <NotificationsLog />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardContent className="pt-6">
                <NotificationTemplates />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Communications;
