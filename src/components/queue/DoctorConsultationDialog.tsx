import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Calendar,
  FileText,
  TestTube,
  CheckCircle,
  Eye,
  AlertCircle,
  Pill,
  Activity,
} from "lucide-react";
import EMRNotesTab from "@/components/clinical/EMRNotesTab";
import AssessmentsTab from "@/components/clinical/AssessmentsTab";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { UpdateOrderStatusDialog } from "@/components/orders/UpdateOrderStatusDialog";
import { OrderResultsDialog } from "@/components/orders/OrderResultsDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DoctorConsultationDialogProps {
  ticket: any;
  patient: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function DoctorConsultationDialog({
  ticket,
  patient,
  open,
  onOpenChange,
  onComplete,
}: DoctorConsultationDialogProps) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (open && patient) {
      loadOrders();
    }
  }, [open, patient?.id]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
  };

  const completeConsultation = async () => {
    // Check for pending orders
    const pendingOrders = orders.filter(
      (o) => o.status === "draft" || o.status === "pending"
    );

    if (pendingOrders.length > 0) {
      toast({
        variant: "destructive",
        title: "Pending orders",
        description: `Please complete or cancel ${pendingOrders.length} pending order(s) before completing consultation.`,
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("tickets")
      .update({
        status: "served",
        served_at: new Date().toISOString(),
        served_by: user?.id,
      })
      .eq("id", ticket.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Consultation completed",
        description: "Patient marked as served",
      });
      onComplete();
      onOpenChange(false);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "outline", label: "Draft" },
      pending: { variant: "secondary", label: "Pending" },
      in_progress: { variant: "default", label: "In Progress" },
      completed: { variant: "default", label: "Completed", className: "bg-green-600" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };

    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      routine: "bg-gray-500",
      urgent: "bg-orange-500",
      stat: "bg-red-500",
    };
    return (
      <Badge className={colors[priority] || colors.routine}>
        {priority?.toUpperCase()}
      </Badge>
    );
  };

  if (!patient) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {patient.first_name} {patient.last_name}
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  MRN: {patient.mrn} | Token: {ticket?.token_number}
                </div>
              </div>
              <Badge className="ml-auto" variant="outline">
                {Math.floor(
                  (new Date().getTime() -
                    new Date(patient.date_of_birth).getTime()) /
                    (365.25 * 24 * 60 * 60 * 1000)
                )}{" "}
                years
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="emr">EMR Notes</TabsTrigger>
              <TabsTrigger value="orders">
                Orders ({orders.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="overview" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Date of Birth</div>
                      <div className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(patient.date_of_birth).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Gender</div>
                      <div className="font-medium capitalize">{patient.sex_at_birth}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">{patient.phone_mobile}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{patient.email || "Not provided"}</div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => setShowCreateOrder(true)}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Create Order
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => setActiveTab("emr")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add EMR Note
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="assessments" className="m-0">
                <AssessmentsTab patientId={patient.id} />
              </TabsContent>

              <TabsContent value="emr" className="m-0">
                <EMRNotesTab
                  patientId={patient.id}
                  onNoteCreated={() => {
                    toast({
                      title: "EMR Note Created",
                      description: "Note has been saved successfully",
                    });
                  }}
                />
              </TabsContent>

              <TabsContent value="orders" className="m-0 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Patient Orders</CardTitle>
                      <Button onClick={() => setShowCreateOrder(true)}>
                        <TestTube className="h-4 w-4 mr-2" />
                        New Order
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {orders.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                {new Date(order.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="capitalize">
                                {order.order_type}
                              </TableCell>
                              <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                              <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
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
                                      setSelectedOrder(order);
                                      setShowUpdateStatus(true);
                                    }}
                                  >
                                    <Activity className="h-4 w-4 mr-1" />
                                    Update
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No orders created yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={completeConsultation}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Consultation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateOrderDialog
        patientId={patient.id}
        open={showCreateOrder}
        onOpenChange={setShowCreateOrder}
        onSuccess={() => {
          loadOrders();
          setActiveTab("orders");
        }}
      />

      <UpdateOrderStatusDialog
        order={selectedOrder}
        open={showUpdateStatus}
        onOpenChange={setShowUpdateStatus}
        onSuccess={() => {
          loadOrders();
          setShowUpdateStatus(false);
        }}
      />
    </>
  );
}
