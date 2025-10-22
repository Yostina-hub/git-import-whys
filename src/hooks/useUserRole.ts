import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "superadmin" | "manager" | "clinician" | "nurse" | "reception" | "billing";

export const useUserRole = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRoles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", session.user.id);

      if (data) {
        setRoles(data.map((r: any) => r.role as UserRole));
      }
      setLoading(false);
    };

    fetchUserRoles();
  }, []);

  const hasRole = (role: UserRole) => roles.includes(role);
  const hasAnyRole = (checkRoles: UserRole[]) => checkRoles.some(role => roles.includes(role));
  const isAdmin = hasAnyRole(["admin", "superadmin"]);

  return { roles, loading, hasRole, hasAnyRole, isAdmin };
};
