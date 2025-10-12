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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
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
