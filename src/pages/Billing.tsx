import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CreateInvoiceDialog } from "@/components/billing/CreateInvoiceDialog";
import { RecordPaymentDialog } from "@/components/billing/RecordPaymentDialog";
import { RefundsTab } from "@/components/billing/RefundsTab";

const Billing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    const { data, error } = await supabase
      .from("invoices")
      .select("*, patients(first_name, last_name, mrn)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading invoices",
        description: error.message,
      });
    } else {
      setInvoices(data || []);
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Billing & Invoicing</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="invoices" className="w-full">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="refunds">Refunds</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Invoices</CardTitle>
                  <CreateInvoiceDialog onInvoiceCreated={loadInvoices} />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Balance Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          {invoice.patients?.mrn} - {invoice.patients?.first_name} {invoice.patients?.last_name}
                        </TableCell>
                        <TableCell>${Number(invoice.total_amount || 0).toFixed(2)}</TableCell>
                        <TableCell>${Number(invoice.balance_due || 0).toFixed(2)}</TableCell>
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
                    ))}
                  </TableBody>
                </Table>

                {invoices.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No invoices created yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refunds">
            <RefundsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Billing;
