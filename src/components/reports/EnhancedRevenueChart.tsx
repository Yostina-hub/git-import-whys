import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, Area, ComposedChart } from "recharts";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    outstanding: number;
  }>;
}

export const EnhancedRevenueChart = ({ data }: RevenueChartProps) => {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          Revenue Overview
          <span className="text-sm font-normal text-muted-foreground">(Last 30 Days)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '12px'
              }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              fill="url(#revenueGradient)"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              name="Revenue"
            />
            <Line 
              type="monotone" 
              dataKey="outstanding" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Outstanding"
              dot={{ fill: 'hsl(var(--destructive))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
