import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Stethoscope, AlertCircle, Video } from "lucide-react";

interface EnhancedDoctorCardProps {
  ticket: any;
  onConsult: (ticket: any) => void;
  onOnlineConsult?: (ticket: any) => void;
}

export const EnhancedDoctorCard = ({
  ticket,
  onConsult,
  onOnlineConsult,
}: EnhancedDoctorCardProps) => {
  const getWaitTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    return diffMinutes;
  };

  const waitTime = getWaitTime(ticket.created_at);
  const isOverdue = waitTime > 15;

  const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
    routine: { color: "text-gray-700 dark:text-gray-300", bg: "bg-gray-100 dark:bg-gray-800", label: "Routine" },
    urgent: { color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-900/30", label: "Urgent" },
    stat: { color: "text-red-700 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900/30", label: "STAT" },
    vip: { color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/30", label: "VIP" },
  };

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    waiting: { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30", label: "Waiting" },
    called: { color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-900/30", label: "Called" },
  };

  const priority = priorityConfig[ticket.priority] || priorityConfig.routine;
  const status = statusConfig[ticket.status] || statusConfig.waiting;

  return (
    <Card className="group relative overflow-hidden border-l-4 border-l-primary transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      {isOverdue && (
        <div className="absolute top-2 right-2 animate-pulse">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {ticket.token_number}
                </span>
                <Badge className={`${priority.bg} ${priority.color} border-0`}>
                  {priority.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">
                  {ticket.patients.first_name} {ticket.patients.last_name}
                </span>
              </div>
            </div>
            <Badge className={`${status.bg} ${status.color} border-0 px-3 py-1`}>
              {status.label}
            </Badge>
          </div>

          {/* Patient Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-mono bg-muted px-2 py-1 rounded">
              MRN: {ticket.patients.mrn}
            </span>
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-semibold' : ''}`}>
              <Clock className="h-4 w-4" />
              <span>{waitTime} min</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all duration-300 shadow-md hover:shadow-lg"
              onClick={() => onConsult(ticket)}
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              In-Person
            </Button>
            {onOnlineConsult && (
              <Button
                variant="outline"
                className="flex-1 border-primary/50 hover:bg-primary/10 transition-all duration-300"
                onClick={() => onOnlineConsult(ticket)}
              >
                <Video className="h-4 w-4 mr-2" />
                Online
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
