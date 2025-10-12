import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatsGridProps {
  stats: {
    totalPatients: number;
    todayAppointments: number;
    pendingAppointments?: number;
    activeTreatments: number;
    avgWaitTime?: number;
    patientsChange?: number;
    treatmentsChange?: number;
    waitTimeChange?: number;
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {/* Total Patients */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                {stats.patientsChange && (
                  <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-50">
                    +{stats.patientsChange}%
                  </Badge>
                )}
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.totalPatients.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-1">Total Patients</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Appointments */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-cyan-600" />
                </div>
                {stats.pendingAppointments !== undefined && (
                  <Badge variant="secondary" className="bg-cyan-50 text-cyan-600 hover:bg-cyan-50">
                    {stats.pendingAppointments} pending
                  </Badge>
                )}
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.todayAppointments}</div>
                <p className="text-sm text-muted-foreground mt-1">Today's Appointments</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Treatments */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                {stats.treatmentsChange && (
                  <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-50">
                    +{stats.treatmentsChange}%
                  </Badge>
                )}
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.activeTreatments}</div>
                <p className="text-sm text-muted-foreground mt-1">Active Treatments</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg Wait Time */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                {stats.waitTimeChange && (
                  <Badge variant="secondary" className="bg-orange-50 text-orange-600 hover:bg-orange-50">
                    {stats.waitTimeChange > 0 ? '+' : ''}{stats.waitTimeChange} min
                  </Badge>
                )}
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.avgWaitTime || 12} min</div>
                <p className="text-sm text-muted-foreground mt-1">Avg. Wait Time</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
