import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus } from "lucide-react";

export function ProviderSchedulesTab() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("first_name", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading providers",
        description: error.message,
      });
    } else {
      setProviders(data || []);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Provider Schedules</CardTitle>
            <CardDescription>
              Manage working hours and availability for clinicians
            </CardDescription>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Provider Scheduling</h3>
            <p className="max-w-md mx-auto mb-4">
              Schedule management allows you to define working hours, break times, and availability
              for each provider across different clinic locations.
            </p>
            <p className="text-sm">
              <strong>Coming Soon:</strong> Weekly schedules, exceptions, time-off management
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
