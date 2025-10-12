import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Mail, MessageSquare, Bell } from "lucide-react";

interface NotificationLog {
  id: string;
  recipient_type: string;
  notification_type: string;
  subject: string | null;
  body: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export const NotificationsLog = () => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      sent: "bg-green-500",
      delivered: "bg-blue-500",
      pending: "bg-yellow-500",
      failed: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading notifications...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No notifications sent yet
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Subject/Preview</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((notification) => (
            <TableRow key={notification.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTypeIcon(notification.notification_type)}
                  <span className="capitalize">{notification.notification_type}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="capitalize">{notification.recipient_type}</span>
              </TableCell>
              <TableCell>
                <div className="max-w-md">
                  {notification.subject && (
                    <div className="font-medium">{notification.subject}</div>
                  )}
                  <div className="text-sm text-muted-foreground truncate">
                    {notification.body}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(notification.status)}>
                  {notification.status}
                </Badge>
                {notification.error_message && (
                  <div className="text-xs text-destructive mt-1">
                    {notification.error_message}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {notification.sent_at
                  ? format(new Date(notification.sent_at), "MMM d, yyyy HH:mm")
                  : format(new Date(notification.created_at), "MMM d, yyyy HH:mm")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
