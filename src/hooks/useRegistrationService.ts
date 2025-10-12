import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RegistrationService {
  id: string;
  unit_price: number;
  name: string;
}

export const useRegistrationService = () => {
  const { toast } = useToast();
  const [registrationService, setRegistrationService] = useState<RegistrationService | null>(null);

  useEffect(() => {
    const loadService = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, unit_price")
        .eq("code", "REG-FEE")
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error loading registration service:", error);
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Could not load registration fee service. Using default value.",
        });
        setRegistrationService({
          id: "",
          name: "Registration Fee",
          unit_price: 50.00
        });
      } else {
        setRegistrationService(data);
      }
    };

    loadService();
  }, [toast]);

  return registrationService;
};
