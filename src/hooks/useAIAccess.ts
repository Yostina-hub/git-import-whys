import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIAccessStatus {
  allowed: boolean;
  reason?: string;
  usage?: number;
  limit?: number;
  remaining?: number;
  token_balance?: number;
  tokens_used_today?: number;
  daily_token_limit?: number;
  tokens_remaining_today?: number;
}

export const useAIAccess = () => {
  const [accessStatus, setAccessStatus] = useState<AIAccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkAccess = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-ai-access");

      if (error) {
        console.error("Error checking AI access:", error);
        setAccessStatus({
          allowed: false,
          reason: "Unable to verify AI access",
        });
        return;
      }

      setAccessStatus(data as AIAccessStatus);
    } catch (error) {
      console.error("Error checking AI access:", error);
      setAccessStatus({
        allowed: false,
        reason: "Unable to verify AI access",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, []);

  const showAccessError = async () => {
    if (accessStatus && !accessStatus.allowed) {
      toast({
        variant: "destructive",
        title: "AI Access Unavailable",
        description: accessStatus.reason || "You don't have access to AI features",
      });
    }
  };

  return {
    accessStatus,
    loading,
    checkAccess,
    showAccessError,
    hasAccess: accessStatus?.allowed || false,
  };
};
