import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClinicsTab } from "@/components/resources/ClinicsTab";
import { ProviderSchedulesTab } from "@/components/resources/ProviderSchedulesTab";
import { HolidaysTab } from "@/components/resources/HolidaysTab";
import { ServicePointsTab } from "@/components/resources/ServicePointsTab";

const Resources = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Clinic & Resource Management</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="clinics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clinics">Clinics</TabsTrigger>
            <TabsTrigger value="service-points">Service Points</TabsTrigger>
            <TabsTrigger value="schedules">Provider Schedules</TabsTrigger>
            <TabsTrigger value="holidays">Holidays & Closures</TabsTrigger>
          </TabsList>

          <TabsContent value="clinics">
            <ClinicsTab />
          </TabsContent>

          <TabsContent value="service-points">
            <ServicePointsTab />
          </TabsContent>

          <TabsContent value="schedules">
            <ProviderSchedulesTab />
          </TabsContent>

          <TabsContent value="holidays">
            <HolidaysTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Resources;
