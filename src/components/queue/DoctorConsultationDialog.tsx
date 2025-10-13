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
import ConsentsTab from "@/components/clinical/ConsentsTab";
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

      // Update ticket status to waiting (for billing)
      const { error: ticketError } = await supabase
        .from("tickets")
        .update({
          status: "waiting",
          served_at: new Date().toISOString(),
          served_by: user?.id,
        })
        .eq("id", ticket.id);

      if (ticketError) throw ticketError;

      toast({
        title: "Invoice Created",
        description: "Invoice sent to billing successfully. Patient will proceed after payment.",
      });

      setShowBillingForm(false);
      setSelectedServices([]);
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const completeConsultation = async () => {
    // If payment required, show billing form
    if (completionAction === "payment_required") {
      setShowBillingForm(true);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    // Check payment requirements based on completion action
    const unpaidInvoices = invoices.filter(inv => 
      inv.status === "issued" || inv.status === "partial"
    );
    
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
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
              <TabsTrigger value="protocols">Protocols</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="emr">EMR Notes</TabsTrigger>
              <TabsTrigger value="consents">Consents</TabsTrigger>
              <TabsTrigger value="orders">
                Orders ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
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

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setShowCreateOrder(true)}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Create Order
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("emr")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add EMR Note
                  </Button>
                </div>
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

              <TabsContent value="consents" className="m-0">
                <ConsentsTab patientId={patient.id} />
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

              <TabsContent value="medications" className="m-0">
                <MedicationsTab patientId={patient.id} />
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex gap-2 items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium">Completion Action:</label>
              <Select value={completionAction} onValueChange={setCompletionAction}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">
                    Complete & Serve (Payment Required)
                  </SelectItem>
                  <SelectItem value="payment_required">
                    Payment Required (Create Invoice)
                  </SelectItem>
                  <SelectItem value="pending_payment">
                    Complete (Pending Payment)
                  </SelectItem>
                  <SelectItem value="schedule">
                    Schedule for Later
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={completeConsultation}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {completionAction === "complete" ? "Complete & Serve" : 
                 completionAction === "payment_required" ? "Create Invoice & Send to Billing" :
                 completionAction === "pending_payment" ? "Complete (Pending Payment)" :
                 "Schedule Patient"}
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
