import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Search, Filter, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { OrderResultsDialog } from "./OrderResultsDialog";
import { UpdateOrderStatusDialog } from "./UpdateOrderStatusDialog";

interface WorklistItem {
  id: string;
  patient_mrn: string;
  patient_name: string;
  order_type: string;
  priority: string;
  status: string;
  ordered_at: string;
  scheduled_at?: string;
  ordered_by: string;
  has_results: boolean;
  turnaround_time?: number;
}

export const OrdersWorklist = () => {
  const [orders, setOrders] = useState<WorklistItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter, typeFilter, priorityFilter]);

  const loadOrders = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        patients(mrn, first_name, last_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading orders",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    if (data) {
      // Fetch provider names separately
      const worklistItems: WorklistItem[] = await Promise.all(
        data.map(async (order: any) => {
          const turnaroundTime = order.completed_at 
            ? Math.floor((new Date(order.completed_at).getTime() - new Date(order.created_at).getTime()) / (1000 * 60))
            : undefined;

          // Get provider info
          let orderedBy = "Unknown";
          if (order.ordered_by) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", order.ordered_by)
              .single();
            
            if (profile) {
              orderedBy = `${profile.first_name} ${profile.last_name}`;
            }
          }

          return {
            id: order.id,
            patient_mrn: order.patients?.mrn || "N/A",
            patient_name: `${order.patients?.first_name} ${order.patients?.last_name}`,
            order_type: order.order_type,
            priority: order.priority,
            status: order.status,
            ordered_at: order.created_at,
            scheduled_at: order.scheduled_at,
            ordered_by: orderedBy,
            has_results: order.result_payload && Object.keys(order.result_payload).length > 0,
            turnaround_time: turnaroundTime,
          };
        })
      );

      setOrders(worklistItems);
    }

    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((order) =>
        order.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.patient_mrn.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((order) => order.order_type === typeFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((order) => order.priority === priorityFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      ordered: "bg-blue-500",
      in_progress: "bg-yellow-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPriorityColor = (priority: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      routine: "secondary",
      urgent: "default",
      stat: "destructive",
    };
    return colors[priority] || "secondary";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "ordered":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orders Worklist</CardTitle>
              <CardDescription>
                Manage and track all orders in one place
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredOrders.length} orders
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="laboratory">Laboratory</SelectItem>
                <SelectItem value="imaging">Imaging</SelectItem>
                <SelectItem value="procedure">Procedure</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="stat">STAT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Worklist Table */}
          {loading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No orders found matching your filters</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ordered</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>TAT</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.patient_name}</div>
                          <div className="text-sm text-muted-foreground">{order.patient_mrn}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {order.order_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(order.priority)} className="capitalize">
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className="capitalize text-sm">{order.status.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(order.ordered_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.scheduled_at 
                          ? format(new Date(order.scheduled_at), "MMM d, HH:mm")
                          : "—"
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.turnaround_time 
                          ? `${order.turnaround_time} min`
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        {order.has_results ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <OrderResultsDialog 
                            orderId={order.id}
                            orderType={order.order_type}
                            onSuccess={loadOrders}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Handle status update inline
                              toast({
                                title: "Status update",
                                description: "Click to update order status",
                              });
                            }}
                          >
                            Update
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
