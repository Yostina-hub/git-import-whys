import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface UsageLog {
  id: string;
  user_id: string;
  feature_type: string;
  tokens_used: number;
  cost_estimate: number;
  created_at: string;
}

interface UsageSummary {
  total_requests: number;
  total_cost: number;
  total_tokens: number;
  today_requests: number;
  today_cost: number;
}

export const AIUsageStats = () => {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [summary, setSummary] = useState<UsageSummary>({
    total_requests: 0,
    total_cost: 0,
    total_tokens: 0,
    today_requests: 0,
    today_cost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    setLoading(true);

    // Get recent logs
    const { data: logsData, error: logsError } = await supabase
      .from("ai_usage_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (logsError) {
      setLoading(false);
      return;
    }

    if (logsData) {
      setLogs(logsData as any as UsageLog[]);

      // Calculate summary
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = logsData.filter((log: any) => 
        log.created_at.startsWith(today)
      );

      setSummary({
        total_requests: logsData.length,
        total_cost: logsData.reduce((sum: number, log: any) => sum + (parseFloat(log.cost_estimate) || 0), 0),
        total_tokens: logsData.reduce((sum: number, log: any) => sum + (log.tokens_used || 0), 0),
        today_requests: todayLogs.length,
        today_cost: todayLogs.reduce((sum: number, log: any) => sum + (parseFloat(log.cost_estimate) || 0), 0),
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.today_requests}</div>
            <p className="text-xs text-muted-foreground">
              ${summary.today_cost.toFixed(4)} estimated cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_requests}</div>
            <p className="text-xs text-muted-foreground">
              Last 50 requests shown
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.total_cost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.total_tokens.toLocaleString()} tokens used
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent AI Usage</CardTitle>
          <CardDescription>Last 50 AI requests across all features</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Est. Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No AI usage recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.user_id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.feature_type}</Badge>
                    </TableCell>
                    <TableCell>{log.tokens_used}</TableCell>
                    <TableCell>${parseFloat(log.cost_estimate.toString()).toFixed(4)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
