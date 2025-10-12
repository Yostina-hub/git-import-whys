import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentTypesConfig } from "@/components/configuration/PaymentTypesConfig";
import { PriceListsConfig } from "@/components/configuration/PriceListsConfig";
import { RulesEngine } from "@/components/configuration/RulesEngine";
import { DiscountExemptionPolicies } from "@/components/configuration/DiscountExemptionPolicies";

const Configuration = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

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
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            <h1 className="text-2xl font-bold">System Configuration</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="payment-types" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payment-types">Payment Types</TabsTrigger>
            <TabsTrigger value="price-lists">Price Lists</TabsTrigger>
            <TabsTrigger value="rules">Rules Engine</TabsTrigger>
            <TabsTrigger value="policies">Discount Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="payment-types">
            <PaymentTypesConfig />
          </TabsContent>

          <TabsContent value="price-lists">
            <PriceListsConfig />
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <RulesEngine />
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <DiscountExemptionPolicies />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Configuration;
