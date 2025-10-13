import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Activity,
  Clock,
  CheckCircle
} from "lucide-react";

interface StatsGridProps {
  stats: {
    totalPatients: number;
    totalAppointments: number;
    totalRevenue: number;
    activeSessions: number;
    pendingInvoices: number;
    completedToday: number;
  };
}

export const AdvancedStatsGrid = ({ stats }: StatsGridProps) => {
  const statCards = [
    {
      title: "Total Patients",
      value: stats.totalPatients.toLocaleString(),
      icon: Users,
      color: "primary",
      bgClass: "bg-primary/10",
      iconClass: "text-primary"
    },
    {
      title: "Total Appointments",
      value: stats.totalAppointments.toLocaleString(),
      icon: Calendar,
      color: "chart-2",
      bgClass: "bg-[hsl(var(--chart-2))]/10",
      iconClass: "text-[hsl(var(--chart-2))]"
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "success",
      bgClass: "bg-[hsl(var(--success))]/10",
      iconClass: "text-[hsl(var(--success))]"
    },
    {
      title: "Active Sessions",
      value: stats.activeSessions.toLocaleString(),
      icon: Activity,
      color: "info",
      bgClass: "bg-[hsl(var(--info))]/10",
      iconClass: "text-[hsl(var(--info))]"
    },
    {
      title: "Pending Invoices",
      value: stats.pendingInvoices.toLocaleString(),
      icon: FileText,
      color: "warning",
      bgClass: "bg-[hsl(var(--warning))]/10",
      iconClass: "text-[hsl(var(--warning))]"
    },
    {
      title: "Completed Today",
      value: stats.completedToday.toLocaleString(),
      icon: CheckCircle,
      color: "chart-4",
      bgClass: "bg-[hsl(var(--chart-4))]/10",
      iconClass: "text-[hsl(var(--chart-4))]"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-3xl font-bold mt-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                  {stat.value}
                </h3>
              </div>
              <div className={`h-14 w-14 rounded-xl ${stat.bgClass} flex items-center justify-center`}>
                <stat.icon className={`h-7 w-7 ${stat.iconClass}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
