import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { CreateInvoiceFromOrderDialog } from "@/components/orders/CreateInvoiceFromOrderDialog";
import { OrdersWorklist } from "@/components/orders/OrdersWorklist";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";

interface Order {
  id: string;
  order_type: string;
  status: string;
  priority: string;
  notes: string | null;
  order_payload: any;
  created_at: string;
  patient_id: string;
  linked_invoice_id: string | null;
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

  useEffect(() => {
    checkAuth();
    loadOrders();
  }, []);

  // Enable realtime updates for orders
  useRealtimeOrders({ onOrderUpdate: loadOrders });

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/5">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Plus className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Orders Management
                  </h1>
                  <p className="text-sm text-muted-foreground">Lab tests, imaging, referrals & prescriptions</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              size="lg"
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-5 w-5" />
              New Order
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <h3 className="text-2xl font-bold text-blue-600">{orders.length}</h3>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <h3 className="text-2xl font-bold text-yellow-600">
                    {orders.filter(o => o.status === 'pending').length}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Edit className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <h3 className="text-2xl font-bold text-green-600">
                    {orders.filter(o => o.status === 'completed').length}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <Badge className="bg-green-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                  <h3 className="text-2xl font-bold text-red-600">
                    {orders.filter(o => o.priority === 'stat' || o.priority === 'urgent').length}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-red-500/10">
                  <ArrowLeft className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 backdrop-blur-sm h-12">
            <TabsTrigger 
              value="list"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Orders List
            </TabsTrigger>
            <TabsTrigger 
              value="worklist"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Search className="h-4 w-4 mr-2" />
              Worklist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {/* Enhanced Filters */}
            <Card className="border-0 shadow-md bg-gradient-to-r from-card to-muted/20">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by patient name or MRN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 border-0 bg-background/50 focus-visible:ring-purple-500"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[200px] border-0 bg-background/50">
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
                    <SelectTrigger className="w-[200px] border-0 bg-background/50">
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
              </CardContent>
            </Card>

            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading orders...
              </div>
            )}

            {!loading && filteredOrders.length === 0 && (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-6 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 mb-4">
                    <Plus className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-semibold text-muted-foreground mb-2">No orders found</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {searchQuery || filterType !== "all" || filterStatus !== "all" 
                      ? "Try adjusting your filters"
                      : "Create your first order to get started"
                    }
                  </p>
                  <Button 
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Order
                  </Button>
                </CardContent>
              </Card>
            )}

            {!loading && filteredOrders.length > 0 && (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <Card 
                    key={order.id}
                    className="border-2 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-card to-muted/30"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        {/* Patient Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Plus className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-semibold text-lg">
                                  {order.patients?.first_name} {order.patients?.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground font-mono">
                                  MRN: {order.patients?.mrn}
                                </div>
                              </div>
                            </div>
                            <Badge className={getOrderTypeColor(order.order_type)}>
                              {order.order_type.toUpperCase()}
                            </Badge>
                            {getPriorityColor(order.priority) === 'bg-red-500' && (
                              <Badge className="bg-red-500 animate-pulse">
                                {order.priority.toUpperCase()}
                              </Badge>
                            )}
                            {getPriorityColor(order.priority) !== 'bg-red-500' && (
                              <Badge className={getPriorityColor(order.priority)}>
                                {order.priority.toUpperCase()}
                              </Badge>
                            )}
                            <Badge 
                              className={getStatusColor(order.status)}
                              variant="outline"
                            >
                              {order.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>

                          {/* Order Details */}
                          <div className="pl-12">
                            <div className="text-sm space-y-1">
                              {order.order_type === "lab" && order.order_payload?.testName && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Test:</span>
                                  <span>{order.order_payload.testName}</span>
                                </div>
                              )}
                              {order.order_type === "imaging" && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Imaging:</span>
                                  <span>
                                    {order.order_payload?.imagingType || ''} {order.order_payload?.bodyPart || ''}
                                  </span>
                                </div>
                              )}
                              {order.order_type === "referral" && order.order_payload?.specialty && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Specialty:</span>
                                  <span>{order.order_payload.specialty}</span>
                                </div>
                              )}
                              {order.order_type === "prescription" && order.order_payload?.medication && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Medication:</span>
                                  <span>{order.order_payload.medication}</span>
                                </div>
                              )}
                              {order.notes && (
                                <div className="flex items-start gap-2 mt-2 p-2 rounded bg-muted/50">
                                  <span className="font-medium">Notes:</span>
                                  <span className="text-muted-foreground">{order.notes}</span>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-2">
                                Created: {format(new Date(order.created_at), "MMM d, yyyy 'at' HH:mm")}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {!order.linked_invoice_id && (
                            <CreateInvoiceFromOrderDialog 
                              order={order} 
                              onInvoiceCreated={loadOrders} 
                            />
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setUpdateDialogOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Update Status
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="worklist">
            <OrdersWorklist />
          </TabsContent>
        </Tabs>
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
