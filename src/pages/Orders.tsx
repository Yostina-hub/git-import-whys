import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Search } from "lucide-react";
import { format } from "date-fns";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { UpdateOrderStatusDialog } from "@/components/orders/UpdateOrderStatusDialog";

interface Order {
  id: string;
  order_type: string;
  status: string;
  priority: string;
  notes: string | null;
  order_payload: any;
  created_at: string;
  patient_id: string;
  patients: {
    first_name: string;
    last_name: string;
    mrn: string;
  };
}

const Orders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    loadOrders();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Load patient data separately for each order
      if (data) {
        const ordersWithPatients = await Promise.all(
          data.map(async (order: any) => {
            const { data: patient } = await supabase
              .from("patients")
              .select("first_name, last_name, mrn")
              .eq("id", order.patient_id)
              .single();

            return {
              ...order,
              patients: patient || { first_name: "", last_name: "", mrn: "" },
            };
          })
        );
        setOrders(ordersWithPatients);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading orders",
        description: error.message,
      });
    }
    setLoading(false);
  };

  const getOrderTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lab: "bg-blue-500",
      imaging: "bg-purple-500",
      referral: "bg-orange-500",
      prescription: "bg-green-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      pending: "bg-yellow-500",
      in_progress: "bg-blue-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      routine: "bg-gray-500",
      urgent: "bg-orange-500",
      stat: "bg-red-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.patients?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patients?.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patients?.mrn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || order.order_type === filterType;
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Orders Management</h1>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name or MRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="lab">Lab Tests</SelectItem>
              <SelectItem value="imaging">Imaging</SelectItem>
              <SelectItem value="referral">Referrals</SelectItem>
              <SelectItem value="prescription">Prescriptions</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading orders...
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No orders found
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {order.patients?.first_name} {order.patients?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          MRN: {order.patients?.mrn}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getOrderTypeColor(order.order_type)}>
                        {order.order_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.order_type === "lab" &&
                          order.order_payload?.testName}
                        {order.order_type === "imaging" &&
                          `${order.order_payload?.imagingType || ''} ${order.order_payload?.bodyPart || ''}`}
                        {order.order_type === "referral" &&
                          order.order_payload?.specialty}
                        {order.order_type === "prescription" &&
                          order.order_payload?.medication}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setUpdateDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <CreateOrderDialog
        patientId={selectedPatient}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadOrders}
      />

      {selectedOrder && (
        <UpdateOrderStatusDialog
          order={selectedOrder}
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          onSuccess={loadOrders}
        />
      )}
    </div>
  );
};

export default Orders;
