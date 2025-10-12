import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, Calendar } from "lucide-react";

interface Activity {
  id: string;
  patientName: string;
  action: string;
  status: "completed" | "pending" | "cancelled";
  time: string;
}

interface RecentActivityProps {
  activities?: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const defaultActivities: Activity[] = [
    {
      id: "1",
      patientName: "Sarah Johnson",
      action: "Appointment completed",
      status: "completed",
      time: "10 min ago",
    },
    {
      id: "2",
      patientName: "Michael Brown",
      action: "Check-in completed",
      status: "completed",
      time: "25 min ago",
    },
    {
      id: "3",
      patientName: "Emily Davis",
      action: "Waiting for consultation",
      status: "pending",
      time: "35 min ago",
    },
    {
      id: "4",
      patientName: "James Wilson",
      action: "Appointment cancelled",
      status: "cancelled",
      time: "1 hour ago",
    },
  ];

  const displayActivities = activities || defaultActivities;

  const getStatusIcon = (status: Activity["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: Activity["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-50">
            completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-orange-50 text-orange-600 hover:bg-orange-50">
            pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-50">
            cancelled
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Button variant="link" className="text-primary text-sm h-auto p-0">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-all cursor-pointer hover-scale"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                  {getStatusIcon(activity.status)}
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.patientName}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(activity.status)}
                <span className="text-xs text-muted-foreground min-w-[70px] text-right">
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
