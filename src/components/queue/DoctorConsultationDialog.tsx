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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Calendar,
  FileText,
  TestTube,
  CheckCircle,
  Activity,
  Pill,
  AlertTriangle,
  FileCheck,
  DollarSign,
  Clock,
  CreditCard,
} from "lucide-react";
import EMRNotesTab from "@/components/clinical/EMRNotesTab";
import AssessmentsTab from "@/components/clinical/AssessmentsTab";
import { VitalSignsTab } from "@/components/clinical/VitalSignsTab";
import { MedicationsTab } from "@/components/clinical/MedicationsTab";
import { AllergiesTab } from "@/components/clinical/AllergiesTab";
import ProtocolsTab from "@/components/clinical/ProtocolsTab";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { UpdateOrderStatusDialog } from "@/components/orders/UpdateOrderStatusDialog";
import { OrderResultsDialog } from "@/components/orders/OrderResultsDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RecordPaymentDialog } from "@/components/billing/RecordPaymentDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";

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
  const [invoices, setInvoices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [completionAction, setCompletionAction] = useState<string>("complete");
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    if (open && patient) {
      loadOrders();
      loadInvoices();
      loadServices();
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

  const loadInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setInvoices(data);
    }
  };

  const loadServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true);
    setServices(data || []);
  };

  const generateInvoiceFromServices = async () => {
    setIsGeneratingInvoice(true);
    
    const consultationService = services.find(s => 
      s.name.toLowerCase().includes('consultation') || 
      s.type.toLowerCase().includes('consultation')
    );

    if (!consultationService) {
      toast({
        variant: "destructive",
        title: "No consultation service found",
        description: "Please configure a consultation service first",
      });
      setIsGeneratingInvoice(false);
      return;
    }

    const lines = [{
      description: consultationService.name,
      quantity: 1,
      unit_price: Number(consultationService.unit_price),
      total: Number(consultationService.unit_price),
    }];

    const subtotal = Number(consultationService.unit_price);
    const tax = subtotal * (Number(consultationService.tax_rate) || 0);
    const total = subtotal + tax;

    const { error } = await supabase.from("invoices").insert({
      patient_id: patient.id,
      appointment_id: ticket?.id,
      lines: lines,
      subtotal,
      tax_amount: tax,
      total_amount: total,
      balance_due: total,
      status: "issued",
      issued_at: new Date().toISOString(),
    });

    setIsGeneratingInvoice(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating invoice",
        description: error.message,
      });
    } else {
      toast({
        title: "Invoice generated",
        description: "Consultation invoice has been created",
      });
      loadInvoices();
    }
  };

  const handleCreateInvoice = async () => {
    if (selectedServices.length === 0) {
      toast({
        title: "Services Required",
        description: "Please select at least one service.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const serviceDetails = services.filter(s => selectedServices.includes(s.id));
      const lines = serviceDetails.map(service => ({
        description: service.name,
        quantity: 1,
        unit_price: Number(service.unit_price),
        total: Number(service.unit_price),
      }));

      const subtotal = lines.reduce((sum, line) => sum + Number(line.total), 0);
      const taxAmount = lines.reduce((sum, line) => sum + (Number(line.total) * 0.16), 0);
      const totalAmount = subtotal + taxAmount;

      const { error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          patient_id: patient.id,
          status: "issued",
          lines,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          balance_due: totalAmount,
          issued_at: new Date().toISOString(),
          created_by: user?.id,
        });

      if (invoiceError) throw invoiceError;

      toast({
        title: "Invoice Created",
        description: "Invoice sent to billing. Waiting for payment before proceeding.",
      });

      setShowBillingForm(false);
      setSelectedServices([]);
      await loadInvoices();
      setActiveTab("overview");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const completeConsultation = async () => {
    // Check for unpaid invoices first
    const unpaidInvoices = invoices.filter(inv => 
      inv.status === "issued" || inv.status === "partial"
    );

    if (unpaidInvoices.length > 0) {
      toast({
        title: "Payment Required",
        description: "Please ensure all invoices are paid before completing the consultation.",
        variant: "destructive",
      });
      return;
    }

    // If payment required, show billing form
    if (completionAction === "payment_required") {
      setShowBillingForm(true);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    // Check for scheduled orders
    const scheduledOrders = orders.filter(o => 
      o.scheduled_at && new Date(o.scheduled_at) > new Date()
    );

    let updateData: any = {
      served_by: user?.id,
    };

    // Determine final status based on completion action
    if (completionAction === "complete") {
      // Standard completion - requires payment
      if (unpaidInvoices.length > 0) {
        toast({
          variant: "destructive",
          title: "Payment required",
          description: "Please complete payment before marking consultation as complete",
        });
        return;
      }
      
      const pendingOrders = orders.filter(
        (o) => o.status === "draft" || o.status === "pending"
      );

      if (pendingOrders.length > 0) {
        toast({
          variant: "destructive",
          title: "Pending orders",
          description: `Please complete or cancel ${pendingOrders.length} pending order(s)`,
        });
        return;
      }

      updateData.status = "served";
      updateData.served_at = new Date().toISOString();
      
    } else if (completionAction === "schedule") {
      // Schedule for future - patient stays in queue
      if (scheduledOrders.length === 0) {
        toast({
          variant: "destructive",
          title: "No scheduled orders",
          description: "Please create a scheduled order first",
        });
        return;
      }
      
      updateData.status = "waiting";
      // Keep ticket active for scheduled orders
      
    } else if (completionAction === "pending_payment") {
      // Consultation done but payment pending
      if (invoices.length === 0) {
        toast({
          variant: "destructive",
          title: "No invoice",
          description: "Please generate an invoice first",
        });
        return;
      }
      
      updateData.status = "waiting";
      // Mark as waiting for payment
    }

    const { error } = await supabase
      .from("tickets")
      .update(updateData)
      .eq("id", ticket.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      const actionMessages: Record<string, string> = {
        complete: "Consultation completed and patient marked as served",
        schedule: "Patient scheduled for future orders",
        pending_payment: "Consultation completed, awaiting payment",
      };
      
      toast({
        title: "Success",
        description: actionMessages[completionAction],
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

  const unpaidInvoices = invoices.filter(inv => 
    inv.status === "issued" || inv.status === "partial"
  );
  const totalDue = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.balance_due), 0);
  const scheduledOrders = orders.filter(o => 
    o.scheduled_at && new Date(o.scheduled_at) > new Date()
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-2xl font-bold">
                  {patient.first_name} {patient.last_name}
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  MRN: {patient.mrn} | Token: {ticket?.token_number}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {Math.floor(
                    (new Date().getTime() -
                      new Date(patient.date_of_birth).getTime()) /
                      (365.25 * 24 * 60 * 60 * 1000)
                  )}{" "}
                  years
                </Badge>
                {unpaidInvoices.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <CreditCard className="h-3 w-3" />
                    ${totalDue.toFixed(2)} Due
                  </Badge>
                )}
                {scheduledOrders.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {scheduledOrders.length} Scheduled
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {unpaidInvoices.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  <strong>Payment Required:</strong> ${totalDue.toFixed(2)} outstanding balance
                </span>
                <div className="flex gap-2">
                  {unpaidInvoices.map(inv => (
                    <RecordPaymentDialog
                      key={inv.id}
                      invoice={inv}
                      onPaymentRecorded={loadInvoices}
                    />
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-9 h-auto p-1 bg-gradient-to-r from-muted/50 to-muted/30">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <Activity className="h-4 w-4 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="vitals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">
                Vitals
              </TabsTrigger>
              <TabsTrigger value="allergies" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">
                Allergies
              </TabsTrigger>
              <TabsTrigger value="protocols" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">
                Protocols
              </TabsTrigger>
              <TabsTrigger value="assessments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">
                Assessments
              </TabsTrigger>
              <TabsTrigger value="emr" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-1" />
                EMR Notes
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white relative">
                <TestTube className="h-4 w-4 mr-1" />
                Orders
                {orders.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{orders.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white relative">
                <DollarSign className="h-4 w-4 mr-1" />
                Billing
                {unpaidInvoices.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{unpaidInvoices.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="medications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">
                <Pill className="h-4 w-4 mr-1" />
                Medications
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

                {invoices.length === 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={generateInvoiceFromServices}
                        disabled={isGeneratingInvoice}
                        className="w-full"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Generate Invoice
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        Generate a consultation invoice for this visit
                      </p>
                    </CardContent>
                  </Card>
                )}

                {unpaidInvoices.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>
                          <strong>Payment Pending:</strong> ${totalDue.toFixed(2)} must be paid before completing consultation
                        </span>
                        <Button size="sm" variant="outline" onClick={loadInvoices}>
                          Refresh Status
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Quick Actions Section */}
                <Card className="border-2 border-dashed bg-gradient-to-br from-muted/30 to-muted/10">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setActiveTab("orders")}
                      variant="outline"
                      className="h-auto flex-col gap-2 py-4 hover:bg-purple-500/10 hover:border-purple-500/50"
                    >
                      <TestTube className="h-6 w-6 text-purple-600" />
                      <div className="text-center">
                        <div className="font-semibold">Orders & Tests</div>
                        <div className="text-xs text-muted-foreground">Lab, Imaging, Rx</div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => setActiveTab("billing")}
                      variant="outline"
                      className="h-auto flex-col gap-2 py-4 hover:bg-green-500/10 hover:border-green-500/50"
                    >
                      <DollarSign className="h-6 w-6 text-green-600" />
                      <div className="text-center">
                        <div className="font-semibold">Billing</div>
                        <div className="text-xs text-muted-foreground">Create Invoice</div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => setActiveTab("emr")}
                      variant="outline"
                      className="h-auto flex-col gap-2 py-4 hover:bg-blue-500/10 hover:border-blue-500/50"
                    >
                      <FileText className="h-6 w-6 text-blue-600" />
                      <div className="text-center">
                        <div className="font-semibold">EMR Notes</div>
                        <div className="text-xs text-muted-foreground">Clinical Notes</div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => setActiveTab("vitals")}
                      variant="outline"
                      className="h-auto flex-col gap-2 py-4 hover:bg-red-500/10 hover:border-red-500/50"
                    >
                      <Activity className="h-6 w-6 text-red-600" />
                      <div className="text-center">
                        <div className="font-semibold">Vitals</div>
                        <div className="text-xs text-muted-foreground">Record Vitals</div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>

                {/* Active Orders Summary */}
                {orders.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-purple-600" />
                        Active Orders ({orders.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {order.order_type}
                            </Badge>
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveTab("orders")}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                      {orders.length > 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setActiveTab("orders")}
                        >
                          View All {orders.length} Orders
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="vitals" className="m-0">
                <VitalSignsTab patientId={patient.id} />
              </TabsContent>

              <TabsContent value="allergies" className="m-0">
                <AllergiesTab patientId={patient.id} />
              </TabsContent>

              <TabsContent value="protocols" className="m-0">
                <ProtocolsTab patientId={patient.id} />
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
                <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-purple-500/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                          <TestTube className="h-5 w-5 text-purple-600" />
                        </div>
                        Patient Orders & Tests
                      </CardTitle>
                      <Button 
                        onClick={() => setShowCreateOrder(true)}
                        className="gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                      >
                        <TestTube className="h-4 w-4" />
                        New Order
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {orders.length > 0 ? (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <Card key={order.id} className="border-2 hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="font-mono">
                                      {order.order_type.toUpperCase()}
                                    </Badge>
                                    {getPriorityBadge(order.priority)}
                                    {getOrderStatusBadge(order.status)}
                                    {order.scheduled_at && (
                                      <Badge variant="secondary" className="gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(order.scheduled_at).toLocaleDateString()}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Created: {new Date(order.created_at).toLocaleString()}
                                  </p>
                                  {order.notes && (
                                    <p className="text-sm">{order.notes}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
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
                                    Update Status
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <div className="flex justify-center">
                          <div className="p-4 rounded-full bg-muted">
                            <TestTube className="h-12 w-12 text-muted-foreground" />
                          </div>
                        </div>
                        <div>
                          <p className="text-lg font-medium text-muted-foreground">No orders yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Create lab tests, imaging, or prescriptions</p>
                        </div>
                        <Button onClick={() => setShowCreateOrder(true)}>
                          <TestTube className="h-4 w-4 mr-2" />
                          Create First Order
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="m-0 space-y-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-green-500/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        Billing & Invoices
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          onClick={generateInvoiceFromServices}
                          disabled={isGeneratingInvoice}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <DollarSign className="h-4 w-4" />
                          Quick Invoice
                        </Button>
                        <Button
                          onClick={() => setShowBillingForm(true)}
                          size="sm"
                          className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600"
                        >
                          <CreditCard className="h-4 w-4" />
                          Create Invoice
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {invoices.length > 0 ? (
                      <div className="space-y-3">
                        {invoices.map((invoice) => (
                          <Card key={invoice.id} className={`border-2 ${
                            invoice.status === 'paid' 
                              ? 'border-green-500/30 bg-green-500/5' 
                              : invoice.status === 'partial'
                              ? 'border-orange-500/30 bg-orange-500/5'
                              : 'border-red-500/30 bg-red-500/5'
                          }`}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-lg">
                                      ${Number(invoice.total_amount).toFixed(2)}
                                    </span>
                                    <Badge className={
                                      invoice.status === 'paid' 
                                        ? 'bg-green-600' 
                                        : invoice.status === 'partial'
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                    }>
                                      {invoice.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Created: {new Date(invoice.created_at).toLocaleDateString()}
                                  </p>
                                  {invoice.balance_due > 0 && (
                                    <p className="text-sm font-medium text-red-600">
                                      Balance Due: ${Number(invoice.balance_due).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {(invoice.status === 'issued' || invoice.status === 'partial') && (
                                    <RecordPaymentDialog
                                      invoice={invoice}
                                      onPaymentRecorded={loadInvoices}
                                    />
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-4">
                        <div className="flex justify-center">
                          <div className="p-4 rounded-full bg-muted">
                            <CreditCard className="h-12 w-12 text-muted-foreground" />
                          </div>
                        </div>
                        <div>
                          <p className="text-lg font-medium text-muted-foreground">No invoices yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Create an invoice to bill for services</p>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={generateInvoiceFromServices}
                            disabled={isGeneratingInvoice}
                            variant="outline"
                          >
                            Quick Invoice
                          </Button>
                          <Button onClick={() => setShowBillingForm(true)}>
                            Custom Invoice
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="medications" className="m-0">
                <MedicationsTab patientId={patient.id} />
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex flex-col gap-4 pt-4 border-t bg-gradient-to-r from-muted/30 to-muted/10 p-4 rounded-lg">
            {/* Consultation Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-2">
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{orders.length}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <TestTube className="h-3 w-3" />
                    Orders Created
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{invoices.length}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <DollarSign className="h-3 w-3" />
                    Invoices
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    ${totalDue.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <CreditCard className="h-3 w-3" />
                    Outstanding
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-sm font-semibold whitespace-nowrap">Complete As:</Label>
              <Select value={completionAction} onValueChange={setCompletionAction}>
                <SelectTrigger className="flex-1 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">
                    ✓ Complete & Serve (Payment Required)
                  </SelectItem>
                  <SelectItem value="payment_required">
                    💳 Create Invoice First
                  </SelectItem>
                  <SelectItem value="pending_payment">
                    ⏳ Complete (Pending Payment)
                  </SelectItem>
                  <SelectItem value="schedule">
                    📅 Schedule for Later
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button 
                onClick={completeConsultation}
                disabled={unpaidInvoices.length > 0 && completionAction !== "payment_required"}
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
              >
                <CheckCircle className="h-5 w-5" />
                {completionAction === "complete" ? "Complete" : 
                 completionAction === "payment_required" ? "Generate Invoice" :
                 completionAction === "pending_payment" ? "Complete" :
                 "Schedule"}
              </Button>
            </div>
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

      {/* Billing Form Dialog */}
      <Dialog open={showBillingForm} onOpenChange={setShowBillingForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Invoice for Billing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Services/Treatments</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {services.map(service => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={service.id}
                      checked={selectedServices.includes(service.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedServices([...selectedServices, service.id]);
                        } else {
                          setSelectedServices(selectedServices.filter(id => id !== service.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={service.id} className="flex-1 cursor-pointer">
                      <div className="flex justify-between">
                        <span className="font-medium">{service.name}</span>
                        <span className="font-semibold">${Number(service.unit_price).toFixed(2)}</span>
                      </div>
                      {service.description && (
                        <p className="text-xs text-muted-foreground">{service.description}</p>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {selectedServices.length > 0 && (
              <div className="bg-muted p-4 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>
                    ${services
                      .filter(s => selectedServices.includes(s.id))
                      .reduce((sum, s) => sum + Number(s.unit_price), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (16%):</span>
                  <span>
                    ${(services
                      .filter(s => selectedServices.includes(s.id))
                      .reduce((sum, s) => sum + Number(s.unit_price), 0) * 0.16)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>
                    ${(services
                      .filter(s => selectedServices.includes(s.id))
                      .reduce((sum, s) => sum + Number(s.unit_price), 0) * 1.16)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBillingForm(false);
              setSelectedServices([]);
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={selectedServices.length === 0}>
              <DollarSign className="h-4 w-4 mr-2" />
              Create Invoice & Send to Billing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
