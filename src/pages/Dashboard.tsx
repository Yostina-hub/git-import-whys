import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ClinicianDashboard } from "@/components/dashboard/ClinicianDashboard";
import { ReceptionDashboard } from "@/components/dashboard/ReceptionDashboard";
import { BillingDashboard } from "@/components/dashboard/BillingDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
      await loadUserRole(session.user.id);
    }
    setLoading(false);
  };

  const loadUserRole = async (userId: string) => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (roles && roles.length > 0) {
        // Priority order: admin > manager > clinician > billing > reception
        const roleHierarchy: Array<"admin" | "manager" | "clinician" | "billing" | "reception"> = 
          ["admin", "manager", "clinician", "billing", "reception"];
        const userRoles = roles.map(r => r.role as string);
        
        for (const role of roleHierarchy) {
          if (userRoles.includes(role)) {
            setUserRole(role);
            return;
          }
        }
        
        setUserRole(userRoles[0]);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out", description: "You have been successfully logged out." });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboard />;
      case "manager":
        return <AdminDashboard />;
      case "clinician":
        return <ClinicianDashboard />;
      case "reception":
        return <ReceptionDashboard />;
      case "billing":
        return <BillingDashboard />;
      default:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">No role assigned. Please contact an administrator.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-muted/30">
      <main className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <DashboardHeader user={user} onLogout={handleLogout} onProfileClick={() => navigate("/profile")} />
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
