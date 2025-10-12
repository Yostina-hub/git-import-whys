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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Search } from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export const AuditLogsTab = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs" as any)
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

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-500",
      update: "bg-blue-500",
      delete: "bg-red-500",
      view: "bg-gray-500",
      login: "bg-purple-500",
      logout: "bg-orange-500",
    };
    return colors[action] || "bg-gray-500";
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (resourceFilter !== "all" && log.resource_type !== resourceFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(search) ||
        log.resource_type.toLowerCase().includes(search) ||
        (log.resource_id && log.resource_id.toLowerCase().includes(search))
      );
    }
    return true;
  });

  if (loading) {
    return <div className="text-center py-8">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[150px]">
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
          </SelectContent>
        </Select>
        <Select value={resourceFilter} onValueChange={setResourceFilter}>
          <SelectTrigger className="w-[150px]">
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Resource ID</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : "Unknown User"}
                </TableCell>
                <TableCell>
                  <Badge className={getActionColor(log.action)}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{log.resource_type}</TableCell>
                <TableCell className="font-mono text-sm">
                  {log.resource_id ? log.resource_id.substring(0, 8) + "..." : "-"}
                </TableCell>
                <TableCell>
                  {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No audit logs found
        </div>
      )}
    </div>
  );
};
