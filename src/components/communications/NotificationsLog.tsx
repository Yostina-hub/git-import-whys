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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Mail, MessageSquare, Bell, Search, Filter, RefreshCw, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationLog {
  id: string;
  recipient_type: string;
  recipient_id: string;
  notification_type: string;
  subject: string | null;
  body: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  metadata: any;
}

export const NotificationsLog = () => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<NotificationLog | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchQuery, statusFilter, typeFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setNotifications(data as any);
    }
    setLoading(false);
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(n => n.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(n => n.notification_type === typeFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.subject?.toLowerCase().includes(query) ||
        n.body.toLowerCase().includes(query) ||
        n.recipient_type.toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: any; className: string; label: string }> = {
      sent: { variant: "default", className: "bg-success text-success-foreground", label: "Sent" },
      delivered: { variant: "default", className: "bg-info text-info-foreground", label: "Delivered" },
      pending: { variant: "secondary", className: "bg-warning/20 text-warning", label: "Pending" },
      failed: { variant: "destructive", className: "", label: "Failed" },
    };
    return configs[status] || { variant: "outline", className: "", label: status };
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
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="icon"
            onClick={loadNotifications}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </span>
      </div>

      {/* Table */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="font-medium text-muted-foreground">No notifications found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {searchQuery || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your filters"
              : "Start sending notifications to see them here"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Recipient</TableHead>
                <TableHead className="font-semibold">Subject/Preview</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notification) => {
                const statusConfig = getStatusConfig(notification.status);
                return (
                  <TableRow 
                    key={notification.id} 
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-muted rounded-lg">
                          {getTypeIcon(notification.notification_type)}
                        </div>
                        <span className="capitalize font-medium">
                          {notification.notification_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">
                        {notification.recipient_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md space-y-1">
                        {notification.subject && (
                          <div className="font-medium text-sm">
                            {notification.subject}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground truncate">
                          {notification.body}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge 
                          variant={statusConfig.variant} 
                          className={statusConfig.className}
                        >
                          {statusConfig.label}
                        </Badge>
                        {notification.error_message && (
                          <div className="text-xs text-destructive mt-1">
                            {notification.error_message}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {notification.delivered_at ? (
                          <div>
                            <div className="font-medium">
                              {format(new Date(notification.delivered_at), "MMM d, HH:mm")}
                            </div>
                            <div className="text-xs text-muted-foreground">Delivered</div>
                          </div>
                        ) : notification.sent_at ? (
                          <div>
                            <div className="font-medium">
                              {format(new Date(notification.sent_at), "MMM d, HH:mm")}
                            </div>
                            <div className="text-xs text-muted-foreground">Sent</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">
                              {format(new Date(notification.created_at), "MMM d, HH:mm")}
                            </div>
                            <div className="text-xs text-muted-foreground">Created</div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNotification(notification)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog 
        open={!!selectedNotification} 
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && getTypeIcon(selectedNotification.notification_type)}
              Notification Details
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Type</div>
                    <Badge variant="outline" className="capitalize">
                      {selectedNotification.notification_type}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                    <Badge 
                      variant={getStatusConfig(selectedNotification.status).variant}
                      className={getStatusConfig(selectedNotification.status).className}
                    >
                      {getStatusConfig(selectedNotification.status).label}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Recipient Type</div>
                    <p className="capitalize">{selectedNotification.recipient_type}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Created At</div>
                    <p>{format(new Date(selectedNotification.created_at), "MMM d, yyyy HH:mm:ss")}</p>
                  </div>
                </div>

                {selectedNotification.subject && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Subject</div>
                    <div className="p-3 bg-muted rounded-lg font-medium">
                      {selectedNotification.subject}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Message Body</div>
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {selectedNotification.body}
                  </div>
                </div>

                {selectedNotification.error_message && (
                  <div>
                    <div className="text-sm font-medium text-destructive mb-2">Error Message</div>
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                      {selectedNotification.error_message}
                    </div>
                  </div>
                )}

                {selectedNotification.sent_at && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Sent At</div>
                    <p>{format(new Date(selectedNotification.sent_at), "MMMM d, yyyy 'at' HH:mm:ss")}</p>
                  </div>
                )}

                {selectedNotification.delivered_at && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Delivered At</div>
                    <p>{format(new Date(selectedNotification.delivered_at), "MMMM d, yyyy 'at' HH:mm:ss")}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};