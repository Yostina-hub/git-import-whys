import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Appointment {
  id: string;
  scheduled_start: string;
  status: string;
  patients: { first_name: string; last_name: string };
}

interface AppointmentCalendarViewProps {
  appointments: Appointment[];
  currentMonth: Date;
}

export const AppointmentCalendarView = ({ appointments, currentMonth }: AppointmentCalendarViewProps) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) =>
      isSameDay(new Date(apt.scheduled_start), day)
    );
  };

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
    <div className="grid grid-cols-7 gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="text-center font-semibold text-sm p-2 text-muted-foreground">
          {day}
        </div>
      ))}
      {days.map((day) => {
        const dayAppointments = getAppointmentsForDay(day);
        return (
          <Card
            key={day.toISOString()}
            className={cn(
              "min-h-[120px] transition-all hover:shadow-md",
              isToday(day) && "border-primary border-2 ring-2 ring-primary/20"
            )}
          >
            <CardContent className="p-2">
              <div className={cn(
                "text-sm font-semibold mb-2",
                isToday(day) ? "text-primary" : "text-muted-foreground"
              )}>
                {format(day, "d")}
              </div>
              <ScrollArea className="h-[80px]">
                <div className="space-y-1">
                  {dayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="text-xs p-1.5 rounded bg-accent hover:bg-accent/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(apt.status))} />
                        <span className="font-medium truncate">
                          {format(new Date(apt.scheduled_start), "HH:mm")}
                        </span>
                      </div>
                      <div className="truncate text-muted-foreground">
                        {apt.patients.first_name} {apt.patients.last_name}
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length === 0 && (
                    <div className="text-xs text-muted-foreground/50 italic">No appointments</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
