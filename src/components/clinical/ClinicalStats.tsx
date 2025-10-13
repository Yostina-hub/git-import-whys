import { Activity, Heart, Pill, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ClinicalStatsProps {
  vitalsCount: number;
  medicationsCount: number;
  allergiesCount: number;
  notesCount: number;
}

export const ClinicalStats = ({
  vitalsCount,
  medicationsCount,
  allergiesCount,
  notesCount,
}: ClinicalStatsProps) => {
  const stats = [
    {
      title: "Vital Signs",
      value: vitalsCount,
      icon: Heart,
      gradient: "from-red-500 to-pink-500",
      bgGradient: "from-red-500/10 to-pink-500/10",
    },
    {
      title: "Medications",
      value: medicationsCount,
      icon: Pill,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      title: "Allergies",
      value: allergiesCount,
      icon: AlertCircle,
      gradient: "from-orange-500 to-amber-500",
      bgGradient: "from-orange-500/10 to-amber-500/10",
    },
    {
      title: "EMR Notes",
      value: notesCount,
      icon: Activity,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10",
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
