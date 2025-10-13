import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, UserCheck, MapPin, FileText, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Appointment {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  reason_for_visit?: string;
  patients: { first_name: string; last_name: string; mrn: string };
  profiles?: { first_name: string; last_name: string } | null;
  services?: { name: string } | null;
  clinics?: { name: string } | null;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange?: (id: string, status: string) => void;
}

export const AppointmentCard = ({ appointment, onStatusChange }: AppointmentCardProps) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      booked: "bg-blue-500",
      confirmed: "bg-green-500",
      arrived: "bg-purple-500",
      in_progress: "bg-orange-500",
      completed: "bg-gray-500",
      cancelled: "bg-red-500",
      no_show: "bg-red-700",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border-2">
      <div className={`h-1 ${getStatusColor(appointment.status)}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold">
                {format(new Date(appointment.scheduled_start), "PPP")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(appointment.scheduled_start), "HH:mm")} - {format(new Date(appointment.scheduled_end), "HH:mm")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status.replace("_", " ")}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onStatusChange?.(appointment.id, "confirmed")}>
                  Mark as Confirmed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.(appointment.id, "arrived")}>
                  Mark as Arrived
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.(appointment.id, "completed")}>
                  Mark as Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.(appointment.id, "cancelled")} className="text-destructive">
                  Cancel Appointment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">
                {appointment.patients.first_name} {appointment.patients.last_name}
              </span>
              <span className="text-xs text-muted-foreground">{appointment.patients.mrn}</span>
            </div>
          </div>

          {appointment.profiles && (
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span>Dr. {appointment.profiles.first_name} {appointment.profiles.last_name}</span>
            </div>
          )}

          {appointment.clinics && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.clinics.name}</span>
            </div>
          )}

          {appointment.services && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.services.name}</span>
            </div>
          )}

          {appointment.reason_for_visit && (
            <div className="mt-3 p-2 bg-accent rounded-md">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Reason: </span>
                {appointment.reason_for_visit}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
