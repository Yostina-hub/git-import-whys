import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign, FileText, Receipt, Settings, RefreshCw, Activity, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CreateInvoiceDialog } from "@/components/billing/CreateInvoiceDialog";
import { RecordPaymentDialog } from "@/components/billing/RecordPaymentDialog";
import { RefundsTab } from "@/components/billing/RefundsTab";
import { PaymentGatewaySettings } from "@/components/billing/PaymentGatewaySettings";
import { DiscountTaxSettings } from "@/components/billing/DiscountTaxSettings";
import { CreatePackageInvoiceDialog } from "@/components/billing/CreatePackageInvoiceDialog";
import { BillingStats } from "@/components/billing/BillingStats";
import { EnhancedInvoiceCard } from "@/components/billing/EnhancedInvoiceCard";

const Billing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [billingStats, setBillingStats] = useState({
    totalInvoices: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueCount: 0,
  });
  
  // Get patient ID from URL if viewing specific patient
  const patientId = searchParams.get("patient");
  const isPatientView = !!patientId;

  useEffect(() => {
    checkAuth();
    loadInvoices();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    
    let query = supabase
      .from("invoices")
      .select("*, patients!inner(first_name, last_name, mrn)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (patientId) {
      query = query.eq("patient_id", patientId);
      
      const { data: patient } = await supabase
        .from("patients")
        .select("first_name, last_name, mrn")
        .eq("id", patientId)
        .maybeSingle();
      
      setPatientInfo(patient);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading invoices",
        description: error.message,
      });
    } else {
      setInvoices(data || []);
      
      // Calculate stats
      if (!isPatientView && data) {
        const paidAmount = data
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
        
        const pendingAmount = data
          .reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);
        
        const overdueCount = data
          .filter(inv => {
            const dueDate = inv.due_date ? new Date(inv.due_date) : null;
            return dueDate && dueDate < new Date() && inv.balance_due > 0;
          }).length;
        
        setBillingStats({
          totalInvoices: data.length,
          paidAmount,
          pendingAmount,
          overdueCount,
        });
      }
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      issued: "bg-blue-500",
      paid: "bg-green-500",
      partial: "bg-yellow-500",
      refunded: "bg-orange-500",
      void: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate(isPatientView ? "/patients" : "/dashboard")}
                className="hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isPatientView ? "Patients" : "Dashboard"}
              </Button>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    {isPatientView && patientInfo 
                      ? `${patientInfo.first_name} ${patientInfo.last_name}`
                      : "Billing & Invoicing"
                    }
                  </h1>
                  {isPatientView && patientInfo && (
                    <p className="text-sm text-muted-foreground">MRN: {patientInfo.mrn}</p>
                  )}
                  {!isPatientView && (
                    <p className="text-sm text-muted-foreground">Financial Management System</p>
                  )}
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadInvoices}
              className="gap-2 hover:bg-primary/10 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {isPatientView ? (
          // Patient-specific view - only show invoices
          <Card>
            <CardHeader>
              <CardTitle>Patient Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading invoices...
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const lines = Array.isArray(invoice.lines) ? invoice.lines : [];
                    const description = lines.length > 0 
                      ? lines[0].description || "Invoice"
                      : "Invoice";
                    
                    return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-muted-foreground">{description}</TableCell>
                      <TableCell className="font-semibold">
                        ${Number(invoice.total_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold text-destructive">
                        ${Number(invoice.balance_due || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.issued_at 
                          ? new Date(invoice.issued_at).toLocaleDateString()
                          : new Date(invoice.created_at).toLocaleDateString()
                        }
                      </TableCell>
                      <TableCell>
                        {invoice.balance_due > 0 && invoice.status !== 'void' && (
                          <RecordPaymentDialog 
                            invoice={invoice} 
                            onPaymentRecorded={loadInvoices} 
                          />
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              )}

              {!loading && invoices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices found for this patient.</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          // Full billing view with all tabs
          <div className="space-y-6">
            {/* Billing Stats */}
            <BillingStats
              totalInvoices={billingStats.totalInvoices}
              paidAmount={billingStats.paidAmount}
              pendingAmount={billingStats.pendingAmount}
              overdueCount={billingStats.overdueCount}
            />

        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger 
              value="invoices"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
            >
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger 
              value="refunds"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Receipt className="h-4 w-4" />
              Refunds
            </TabsTrigger>
            <TabsTrigger 
              value="gateways"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300"
            >
              <DollarSign className="h-4 w-4" />
              Payment Gateways
            </TabsTrigger>
            <TabsTrigger 
              value="config"
              className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Settings className="h-4 w-4" />
              Discounts & Tax
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    All Invoices
                  </CardTitle>
                  <div className="flex gap-2">
                    <CreateInvoiceDialog onInvoiceCreated={loadInvoices} />
                    <CreatePackageInvoiceDialog onInvoiceCreated={loadInvoices} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading invoices...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {invoices.map((invoice) => (
                      <EnhancedInvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        onPaymentRecorded={loadInvoices}
                      />
                    ))}
                  </div>
                )}

                {!loading && invoices.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="p-4 rounded-full bg-muted mb-4">
                        <DollarSign className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground">No invoices created yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Create your first invoice to get started</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refunds">
            <RefundsTab />
          </TabsContent>

          <TabsContent value="gateways">
            <PaymentGatewaySettings />
          </TabsContent>

          <TabsContent value="config">
            <DiscountTaxSettings />
          </TabsContent>
        </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Billing;
