import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2 } from "lucide-react";

interface ClinicAccessBadgeProps {
  userId: string;
}

export function ClinicAccessBadge({ userId }: ClinicAccessBadgeProps) {
  const [loading, setLoading] = useState(true);
  const [accessSummary, setAccessSummary] = useState<string>("");

  useEffect(() => {
    loadAccess();
  }, [userId]);

  const loadAccess = async () => {
    try {
      const { data: grants } = await supabase
        .from("user_clinic_grant" as any)
        .select("*")
        .eq("user_id", userId);

      if (!grants || grants.length === 0) {
        setAccessSummary("No access");
        setLoading(false);
        return;
      }

      const typedGrants = grants as any[];
      
      const hasAllRead = typedGrants.some((g: any) => g.scope === 'read' && g.all_clinics);
      const hasAllWrite = typedGrants.some((g: any) => g.scope === 'write' && g.all_clinics);

      if (hasAllRead && hasAllWrite) {
        setAccessSummary("All clinics (R/W)");
      } else if (hasAllRead) {
        setAccessSummary("All clinics (R)");
      } else if (hasAllWrite) {
        setAccessSummary("All clinics (W)");
      } else {
        const readCount = typedGrants.filter((g: any) => g.scope === 'read' && !g.all_clinics).length;
        const writeCount = typedGrants.filter((g: any) => g.scope === 'write' && !g.all_clinics).length;
        
        if (readCount > 0 && writeCount > 0) {
          setAccessSummary(`${Math.max(readCount, writeCount)} clinics`);
        } else if (readCount > 0) {
          setAccessSummary(`${readCount} (R)`);
        } else if (writeCount > 0) {
          setAccessSummary(`${writeCount} (W)`);
        } else {
          setAccessSummary("No access");
        }
      }
    } catch (error) {
      setAccessSummary("Error");
    }
    setLoading(false);
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <Badge variant="outline" className="gap-1">
      <Building2 className="h-3 w-3" />
      {accessSummary}
    </Badge>
  );
}
