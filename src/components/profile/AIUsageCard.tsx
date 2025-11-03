import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Zap } from "lucide-react";
import { useAIAccess } from "@/hooks/useAIAccess";

export const AIUsageCard = () => {
  const { accessStatus, loading: accessLoading } = useAIAccess();
  const [todayUsage, setTodayUsage] = useState(0);

  useEffect(() => {
    loadTodayUsage();
  }, []);

  const loadTodayUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from("ai_usage_log" as any)
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", today);

    if (!error && data) {
      setTodayUsage(data.length);
    }
  };

  if (accessLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading AI usage...
        </CardContent>
      </Card>
    );
  }

  if (!accessStatus?.allowed) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Features
          </CardTitle>
          <CardDescription>Access Status</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="mb-2">
            Access Disabled
          </Badge>
          <p className="text-sm text-muted-foreground">
            {accessStatus?.reason || "You don't have access to AI features"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Contact your administrator to request AI access.
          </p>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = accessStatus.limit
    ? (todayUsage / accessStatus.limit) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Usage Today
        </CardTitle>
        <CardDescription>Your daily AI request limit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="default">
              <Zap className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
          <div className="text-2xl font-bold">
            {todayUsage} / {accessStatus.limit}
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={usagePercentage} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{accessStatus.remaining} requests remaining</span>
            <span>{Math.round(usagePercentage)}%</span>
          </div>
        </div>

        {usagePercentage > 80 && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-md">
            <TrendingUp className="h-4 w-4 text-warning mt-0.5" />
            <p className="text-sm text-warning">
              You're approaching your daily limit. Consider optimizing your AI usage.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
