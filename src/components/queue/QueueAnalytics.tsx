import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, Users, AlertTriangle } from "lucide-react";

interface QueueMetrics {
  totalTickets: number;
  avgWaitTime: number;
  slaCompliance: number;
  peakHour: string;
  byPriority: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  hourlyTrend: { hour: string; tickets: number; avgWait: number }[];
  performanceByQueue: { queue: string; tickets: number; avgWait: number; slaBreaches: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const QueueAnalytics = () => {
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [timeRange, setTimeRange] = useState("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);

    const startDate = getStartDate(timeRange);
    
    const { data: tickets } = await supabase
      .from("tickets")
      .select("*, queues(name)")
      .gte("created_at", startDate.toISOString());

    if (tickets) {
      const totalTickets = tickets.length;
      
      // Calculate average wait time
      const waitTimes = tickets
        .filter(t => t.served_at)
        .map(t => {
          const created = new Date(t.created_at);
          const served = new Date(t.served_at);
          return (served.getTime() - created.getTime()) / 60000; // minutes
        });
      const avgWaitTime = waitTimes.length > 0 
        ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : 0;

      // SLA compliance (assuming 30 min SLA)
      const slaBreaches = waitTimes.filter(t => t > 30).length;
      const slaCompliance = waitTimes.length > 0
        ? Math.round(((waitTimes.length - slaBreaches) / waitTimes.length) * 100)
        : 100;

      // Priority distribution
      const priorityCounts = tickets.reduce((acc: any, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      }, {});
      const byPriority = Object.entries(priorityCounts).map(([name, value]) => ({
        name: name.toUpperCase(),
        value: value as number,
      }));

      // Status distribution
      const statusCounts = tickets.reduce((acc: any, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});
      const byStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.toUpperCase(),
        value: value as number,
      }));

      // Hourly trend
      const hourlyData: { [key: string]: { tickets: number; totalWait: number; count: number } } = {};
      tickets.forEach(t => {
        const hour = new Date(t.created_at).getHours();
        const hourKey = `${hour}:00`;
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = { tickets: 0, totalWait: 0, count: 0 };
        }
        hourlyData[hourKey].tickets++;
        
        if (t.served_at) {
          const wait = (new Date(t.served_at).getTime() - new Date(t.created_at).getTime()) / 60000;
          hourlyData[hourKey].totalWait += wait;
          hourlyData[hourKey].count++;
        }
      });

      const hourlyTrend = Object.entries(hourlyData)
        .map(([hour, data]) => ({
          hour,
          tickets: data.tickets,
          avgWait: data.count > 0 ? Math.round(data.totalWait / data.count) : 0,
        }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      // Peak hour
      const peakHour = hourlyTrend.reduce((max, curr) => 
        curr.tickets > max.tickets ? curr : max, hourlyTrend[0]
      )?.hour || "N/A";

      // Performance by queue
      const queueData: { [key: string]: { tickets: number; totalWait: number; count: number; breaches: number } } = {};
      tickets.forEach(t => {
        const queueName = (t.queues as any)?.name || "Unknown";
        if (!queueData[queueName]) {
          queueData[queueName] = { tickets: 0, totalWait: 0, count: 0, breaches: 0 };
        }
        queueData[queueName].tickets++;
        
        if (t.served_at) {
          const wait = (new Date(t.served_at).getTime() - new Date(t.created_at).getTime()) / 60000;
          queueData[queueName].totalWait += wait;
          queueData[queueName].count++;
          if (wait > 30) queueData[queueName].breaches++;
        }
      });

      const performanceByQueue = Object.entries(queueData).map(([queue, data]) => ({
        queue,
        tickets: data.tickets,
        avgWait: data.count > 0 ? Math.round(data.totalWait / data.count) : 0,
        slaBreaches: data.breaches,
      }));

      setMetrics({
        totalTickets,
        avgWaitTime,
        slaCompliance,
        peakHour,
        byPriority,
        byStatus,
        hourlyTrend,
        performanceByQueue,
      });
    }

    setLoading(false);
  };

  const getStartDate = (range: string): Date => {
    const now = new Date();
    switch (range) {
      case "today":
        return new Date(now.setHours(0, 0, 0, 0));
      case "week":
        return new Date(now.setDate(now.getDate() - 7));
      case "month":
        return new Date(now.setMonth(now.getMonth() - 1));
      default:
        return new Date(now.setHours(0, 0, 0, 0));
    }
  };

  if (loading || !metrics) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Queue Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTickets}</div>
            <p className="text-xs text-muted-foreground">All statuses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgWaitTime}<span className="text-sm font-normal">min</span></div>
            <p className="text-xs text-muted-foreground">From creation to service</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${metrics.slaCompliance >= 80 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.slaCompliance}%</div>
            <p className="text-xs text-muted-foreground">Target: 80%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.peakHour}</div>
            <p className="text-xs text-muted-foreground">Highest volume</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Ticket Volume & Wait Time</CardTitle>
              <CardDescription>Ticket creation and average wait time by hour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.hourlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="tickets" stroke="#8884d8" name="Tickets" />
                  <Line yAxisId="right" type="monotone" dataKey="avgWait" stroke="#82ca9d" name="Avg Wait (min)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Priority</CardTitle>
                <CardDescription>Distribution of ticket priorities</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metrics.byPriority}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics.byPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metrics.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Performance Comparison</CardTitle>
              <CardDescription>Average wait time and SLA breaches by queue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.performanceByQueue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="queue" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgWait" fill="#8884d8" name="Avg Wait (min)" />
                  <Bar yAxisId="right" dataKey="slaBreaches" fill="#ff8042" name="SLA Breaches" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
