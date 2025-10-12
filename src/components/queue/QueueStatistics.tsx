import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";

interface QueueStatisticsProps {
  tickets: any[];
  slaMinutes: number;
}

export const QueueStatistics = ({ tickets, slaMinutes }: QueueStatisticsProps) => {
  const waitingCount = tickets.filter(t => t.status === "waiting").length;
  const calledCount = tickets.filter(t => t.status === "called").length;
  const servedToday = tickets.filter(t => {
    const today = new Date().toDateString();
    return t.served_at && new Date(t.served_at).toDateString() === today;
  }).length;

  const getWaitTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    return Math.floor((now.getTime() - created.getTime()) / 60000);
  };

  const activeTickets = tickets.filter(t => t.status === "waiting" || t.status === "called");
  const avgWaitTime = activeTickets.length > 0
    ? Math.round(activeTickets.reduce((acc, t) => acc + getWaitTime(t.created_at), 0) / activeTickets.length)
    : 0;

  const slaBreaches = activeTickets.filter(t => getWaitTime(t.created_at) > slaMinutes).length;
  const slaCompliance = activeTickets.length > 0 
    ? Math.round(((activeTickets.length - slaBreaches) / activeTickets.length) * 100)
    : 100;

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Waiting</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{waitingCount}</div>
          <p className="text-xs text-muted-foreground">
            In queue
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Called</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{calledCount}</div>
          <p className="text-xs text-muted-foreground">
            Being served
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgWaitTime}<span className="text-sm font-normal">min</span></div>
          <p className="text-xs text-muted-foreground">
            Current average
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Served Today</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{servedToday}</div>
          <p className="text-xs text-muted-foreground">
            Completed tickets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${slaCompliance >= 80 ? 'text-green-500' : 'text-red-500'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{slaCompliance}%</div>
          <p className="text-xs text-muted-foreground">
            {slaBreaches} breaches
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
