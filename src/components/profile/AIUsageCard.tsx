import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Zap, Coins } from "lucide-react";
import { useAIAccess } from "@/hooks/useAIAccess";
import { useNavigate } from "react-router-dom";

export const AIUsageCard = () => {
  const { accessStatus, loading: accessLoading } = useAIAccess();
  const [todayUsage, setTodayUsage] = useState(0);
  const [tokensUsedToday, setTokensUsedToday] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadTodayUsage();
  }, []);

  const loadTodayUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from("ai_usage_log" as any)
      .select("tokens_used")
      .eq("user_id", user.id)
      .gte("created_at", today);

    if (!error && data) {
      setTodayUsage(data.length);
      const totalTokens = data.reduce((sum: number, log: any) => sum + (log.tokens_used || 0), 0);
      setTokensUsedToday(totalTokens);
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
  
  const tokenPercentage = accessStatus.daily_token_limit
    ? (tokensUsedToday / accessStatus.daily_token_limit) * 100
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Request Usage
          </CardTitle>
          <CardDescription>Daily AI request limit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="default">
              <Zap className="h-3 w-3 mr-1" />
              Active
            </Badge>
            <div className="text-2xl font-bold">
              {todayUsage} / {accessStatus.limit}
            </div>
          </div>

          <div className="space-y-2">
            <Progress value={usagePercentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{accessStatus.remaining} remaining</span>
              <span>{Math.round(usagePercentage)}%</span>
            </div>
          </div>

          {usagePercentage > 80 && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-md">
              <TrendingUp className="h-4 w-4 text-warning mt-0.5" />
              <p className="text-sm text-warning">
                Approaching daily limit
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Token Usage
          </CardTitle>
          <CardDescription>Daily token limit & balance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Today</span>
              <span className="font-semibold">
                {tokensUsedToday.toLocaleString()} / {(accessStatus.daily_token_limit || 0).toLocaleString()}
              </span>
            </div>
            <Progress value={tokenPercentage} className="h-2" />
            
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Token Balance</span>
              <span className="text-lg font-bold text-primary">
                {(accessStatus.token_balance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <Button 
            onClick={() => navigate('/configuration')} 
            variant="outline" 
            className="w-full"
          >
            <Coins className="h-4 w-4 mr-2" />
            Purchase Tokens
          </Button>

          {tokenPercentage > 80 && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-md">
              <TrendingUp className="h-4 w-4 text-warning mt-0.5" />
              <p className="text-sm text-warning">
                High token usage today
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
