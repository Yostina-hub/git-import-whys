import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Mail, 
  Bell, 
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar
} from "lucide-react";
import { NotificationTemplates } from "@/components/communications/NotificationTemplates";
import { NotificationsLog } from "@/components/communications/NotificationsLog";
import { SendNotificationDialog } from "@/components/communications/SendNotificationDialog";
import { Badge } from "@/components/ui/badge";

const Communications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSent: 0,
    sentToday: 0,
    pendingScheduled: 0,
    failedToday: 0,
    deliveryRate: 0,
    emailSent: 0,
    smsSent: 0,
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total sent notifications
    const { count: totalSent } = await supabase
      .from("notifications_log")
      .select("*", { count: "exact", head: true })
      .in("status", ["sent", "delivered"]);

    // Get sent today
    const { count: sentToday } = await supabase
      .from("notifications_log")
      .select("*", { count: "exact", head: true })
      .in("status", ["sent", "delivered"])
      .gte("created_at", today.toISOString());

    // Get pending scheduled notifications
    const { count: pendingScheduled } = await supabase
      .from("scheduled_notifications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Get failed notifications today
    const { count: failedToday } = await supabase
      .from("notifications_log")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", today.toISOString());

    // Get email count
    const { count: emailSent } = await supabase
      .from("notifications_log")
      .select("*", { count: "exact", head: true })
      .eq("notification_type", "email")
      .in("status", ["sent", "delivered"]);

    // Get SMS count
    const { count: smsSent } = await supabase
      .from("notifications_log")
      .select("*", { count: "exact", head: true })
      .eq("notification_type", "sms")
      .in("status", ["sent", "delivered"]);

    // Calculate delivery rate
    const totalAttempted = (totalSent || 0) + (failedToday || 0);
    const deliveryRate = totalAttempted > 0 
      ? Math.round(((totalSent || 0) / totalAttempted) * 100)
      : 100;

    setStats({
      totalSent: totalSent || 0,
      sentToday: sentToday || 0,
      pendingScheduled: pendingScheduled || 0,
      failedToday: failedToday || 0,
      deliveryRate,
      emailSent: emailSent || 0,
      smsSent: smsSent || 0,
    });

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-7 w-7 text-primary" />
                </div>
                Communications Center
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage patient notifications, reminders, and messaging
              </p>
            </div>
            <SendNotificationDialog onSent={loadStats} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Send className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.sentToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                {stats.totalSent} all time
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.deliveryRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Success rate
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <div className="p-2 bg-info/10 rounded-lg">
                <Clock className="h-4 w-4 text-info" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-info">{stats.pendingScheduled}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending delivery
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Failed Today</CardTitle>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.failedToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Channel Stats */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Communications
              </CardTitle>
              <CardDescription>Email notifications sent to patients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.emailSent}</div>
                  <p className="text-sm text-muted-foreground">Total emails sent</p>
                </div>
                <Badge variant="outline" className="bg-primary/10">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-info">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-info" />
                SMS Communications
              </CardTitle>
              <CardDescription>Text messages sent to patients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.smsSent}</div>
                  <p className="text-sm text-muted-foreground">Total SMS sent</p>
                </div>
                <Badge variant="outline" className="bg-info/10">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="log" className="gap-2">
              <Bell className="h-4 w-4" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Mail className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log">
            <Card>
              <CardHeader>
                <CardTitle>Notifications Activity</CardTitle>
                <CardDescription>
                  Recent notification history and delivery status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationsLog />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Notifications</CardTitle>
                <CardDescription>
                  Upcoming automated notifications and reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No scheduled notifications</p>
                  <p className="text-sm mt-2">
                    Automated reminders will appear here when configured
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>
                  Pre-configured templates for common communications
                </CardDescription>
              </CardHeader>
              <CardContent>
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