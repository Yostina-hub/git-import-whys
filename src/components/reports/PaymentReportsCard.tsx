import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth, subMonths } from "date-fns";

interface PaymentData {
  date: string;
  amount: number;
  count: number;
}

interface PaymentReportsCardProps {
  payments: PaymentData[];
  period: 'daily' | 'weekly' | 'monthly' | '3month' | 'yearly';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly' | '3month' | 'yearly') => void;
}

export const PaymentReportsCard = ({ payments, period, onPeriodChange }: PaymentReportsCardProps) => {
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalTransactions = payments.reduce((sum, p) => sum + p.count, 0);
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Calculate trend (compare last half vs first half)
  const midPoint = Math.floor(payments.length / 2);
  const firstHalf = payments.slice(0, midPoint).reduce((sum, p) => sum + p.amount, 0);
  const secondHalf = payments.slice(midPoint).reduce((sum, p) => sum + p.amount, 0);
  const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Payment Analytics</CardTitle>
            <CardDescription>Comprehensive revenue tracking across all time periods</CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => onPeriodChange(v as any)} className="w-auto">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="3month">3 Months</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <h3 className="text-2xl font-bold mt-1">{totalTransactions}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-chart-2/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-[hsl(var(--chart-2))]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Transaction</p>
                  <h3 className="text-2xl font-bold mt-1">${avgTransaction.toFixed(2)}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[hsl(var(--chart-3))]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Growth Trend</p>
                  <h3 className="text-2xl font-bold mt-1 flex items-center gap-2">
                    {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                    {trend > 0 ? (
                      <TrendingUp className="h-5 w-5 text-[hsl(var(--success))]" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                  </h3>
                </div>
                <div className={`h-12 w-12 rounded-full ${trend > 0 ? 'bg-success/10' : 'bg-destructive/10'} flex items-center justify-center`}>
                  {trend > 0 ? (
                    <TrendingUp className="h-6 w-6 text-[hsl(var(--success))]" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={payments}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
