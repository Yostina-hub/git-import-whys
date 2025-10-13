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
import { Search, RefreshCw, Download, Eye, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: any;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export const AuditLogsTab = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, actionFilter, resourceFilter, searchTerm]);

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        *,
        profiles:user_id (first_name, last_name)
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!error && data) {
      setLogs(data as any);
    }
    setLoading(false);
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (resourceFilter !== "all") {
      filtered = filtered.filter(log => log.resource_type === resourceFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(search) ||
        log.resource_type.toLowerCase().includes(search) ||
        (log.resource_id && log.resource_id.toLowerCase().includes(search)) ||
        (log.profiles && 
          `${log.profiles.first_name} ${log.profiles.last_name}`.toLowerCase().includes(search))
      );
    }

    setFilteredLogs(filtered);
  };

  const getActionConfig = (action: string) => {
    const configs: Record<string, { variant: any; className: string; icon: string }> = {
      create: { variant: "default", className: "bg-success text-success-foreground", icon: "+" },
      update: { variant: "default", className: "bg-info text-info-foreground", icon: "~" },
      delete: { variant: "destructive", className: "", icon: "×" },
      view: { variant: "secondary", className: "", icon: "👁" },
      login: { variant: "default", className: "bg-primary", icon: "🔐" },
      logout: { variant: "outline", className: "", icon: "🚪" },
      grant_role: { variant: "default", className: "bg-purple-600", icon: "✓" },
      revoke_role: { variant: "destructive", className: "bg-orange-600", icon: "✗" },
    };
    return configs[action] || { variant: "outline", className: "", icon: "•" };
  };

  const exportToCSV = () => {
    const headers = ["Timestamp", "User", "Action", "Resource Type", "Resource ID"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        log.profiles ? `"${log.profiles.first_name} ${log.profiles.last_name}"` : "System",
        log.action,
        log.resource_type,
        log.resource_id || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
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
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs by user, action, resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="view">View</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="grant_role">Grant Role</SelectItem>
              <SelectItem value="revoke_role">Revoke Role</SelectItem>
            </SelectContent>
          </Select>

          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="patient">Patient</SelectItem>
              <SelectItem value="appointment">Appointment</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={loadLogs} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={exportToCSV} title="Export to CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredLogs.length} of {logs.length} audit logs
        </span>
      </div>

      {/* Table */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <div className="text-4xl mb-4 opacity-50">📋</div>
          <p className="font-medium text-muted-foreground">No audit logs found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {searchTerm || actionFilter !== "all" || resourceFilter !== "all"
              ? "Try adjusting your filters"
              : "Activity will be logged here as users interact with the system"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Timestamp</TableHead>
                <TableHead className="font-semibold">User</TableHead>
                <TableHead className="font-semibold">Action</TableHead>
                <TableHead className="font-semibold">Resource Type</TableHead>
                <TableHead className="font-semibold">Resource ID</TableHead>
                <TableHead className="text-right font-semibold">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const actionConfig = getActionConfig(log.action);
                return (
                  <TableRow 
                    key={log.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="text-sm">
                          {format(new Date(log.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "HH:mm:ss")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-semibold text-primary">
                          {log.profiles 
                            ? `${log.profiles.first_name[0]}${log.profiles.last_name[0]}`
                            : "SY"
                          }
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {log.profiles 
                              ? `${log.profiles.first_name} ${log.profiles.last_name}`
                              : "System"
                            }
                          </div>
                          {log.user_id && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {log.user_id.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={actionConfig.variant} 
                        className={actionConfig.className}
                      >
                        <span className="mr-1">{actionConfig.icon}</span>
                        {log.action.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize font-medium">
                        {log.resource_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.resource_id ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {log.resource_id.substring(0, 8)}...
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
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
        open={!!selectedLog} 
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📋 Audit Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Timestamp</div>
                    <p className="font-medium">
                      {format(new Date(selectedLog.created_at), "MMMM d, yyyy 'at' HH:mm:ss")}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">User</div>
                    <p className="font-medium">
                      {selectedLog.profiles 
                        ? `${selectedLog.profiles.first_name} ${selectedLog.profiles.last_name}`
                        : "System"
                      }
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Action</div>
                    <Badge 
                      variant={getActionConfig(selectedLog.action).variant}
                      className={getActionConfig(selectedLog.action).className}
                    >
                      {selectedLog.action.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Resource Type</div>
                    <p className="capitalize font-medium">{selectedLog.resource_type}</p>
                  </div>
                </div>

                {selectedLog.resource_id && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Resource ID</div>
                    <code className="block p-3 bg-muted rounded-lg font-mono text-sm break-all">
                      {selectedLog.resource_id}
                    </code>
                  </div>
                )}

                {selectedLog.user_id && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">User ID</div>
                    <code className="block p-3 bg-muted rounded-lg font-mono text-sm break-all">
                      {selectedLog.user_id}
                    </code>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Metadata</div>
                    <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
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