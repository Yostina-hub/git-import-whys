import { Users, Shield, Activity, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AdminStatsProps {
  totalUsers: number;
  activeUsers: number;
  totalActions: number;
  systemHealth: number;
}

export const AdminStats = ({
  totalUsers,
  activeUsers,
  totalActions,
  systemHealth,
}: AdminStatsProps) => {
  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: Shield,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10",
    },
    {
      title: "Total Actions",
      value: totalActions,
      icon: Activity,
      gradient: "from-orange-500 to-amber-500",
      bgGradient: "from-orange-500/10 to-amber-500/10",
    },
    {
      title: "System Health",
      value: `${systemHealth}%`,
      icon: Database,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-gradient-to-br ${stat.gradient}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
