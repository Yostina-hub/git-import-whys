import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

interface AppointmentChartProps {
  data: Array<{
    date: string;
    booked: number;
    completed: number;
    cancelled: number;
  }>;
}

export const EnhancedAppointmentChart = ({ data }: AppointmentChartProps) => {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl">Appointment Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
            <Legend />
            <Bar dataKey="booked" fill="hsl(var(--primary))" name="Booked" radius={[8, 8, 0, 0]} />
            <Bar dataKey="completed" fill="hsl(var(--success))" name="Completed" radius={[8, 8, 0, 0]} />
            <Bar dataKey="cancelled" fill="hsl(var(--destructive))" name="Cancelled" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
