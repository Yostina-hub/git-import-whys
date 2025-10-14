import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
}

interface AIInsightsPanelProps {
  doctors: Doctor[];
  selectedDoctorId: string | null;
}

export const AIInsightsPanel = ({ doctors, selectedDoctorId }: AIInsightsPanelProps) => {
  const [insights, setInsights] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: doctorData } = useQuery({
    queryKey: ['doctor-detailed-data', selectedDoctorId],
    queryFn: async () => {
      if (!selectedDoctorId) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('provider_id', selectedDoctorId)
        .gte('scheduled_start', thirtyDaysAgo.toISOString());

      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('ordered_by', selectedDoctorId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      return {
        appointments,
        orders,
        doctor: doctors.find(d => d.id === selectedDoctorId)
      };
    },
    enabled: !!selectedDoctorId
  });

  const analyzePerformance = async () => {
    if (!doctorData) {
      toast.error("Please select a doctor first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('clinical-analysis', {
        body: {
          type: 'doctor_performance',
          data: {
            doctor: doctorData.doctor,
            appointments: doctorData.appointments,
            orders: doctorData.orders,
            timeframe: '30 days'
          }
        }
      });

      if (error) throw error;

      setInsights(data.analysis || data.generatedText || "No insights generated");
      toast.success("AI analysis complete");
    } catch (error: any) {
      console.error('AI analysis error:', error);
      toast.error(error.message || "Failed to generate insights");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateRecommendations = async () => {
    if (!doctorData) {
      toast.error("Please select a doctor first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('clinical-analysis', {
        body: {
          type: 'recommendations',
          data: {
            doctor: doctorData.doctor,
            appointments: doctorData.appointments,
            performanceMetrics: {
              totalAppointments: doctorData.appointments?.length || 0,
              completedAppointments: doctorData.appointments?.filter(a => a.status === 'completed').length || 0,
              ordersPlaced: doctorData.orders?.length || 0
            }
          }
        }
      });

      if (error) throw error;

      setInsights(data.analysis || data.generatedText || "No recommendations generated");
      toast.success("Recommendations generated");
    } catch (error: any) {
      console.error('AI recommendations error:', error);
      toast.error(error.message || "Failed to generate recommendations");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Get intelligent analysis and recommendations for doctor performance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedDoctorId ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select a doctor from the Performance tab to generate AI insights
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex gap-3">
              <Button 
                onClick={analyzePerformance} 
                disabled={isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analyze Performance
                  </>
                )}
              </Button>
              
              <Button 
                onClick={generateRecommendations} 
                disabled={isAnalyzing}
                variant="outline"
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Get Recommendations
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {insights && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>AI Analysis Results</CardTitle>
            <CardDescription>
              Insights for Dr. {doctorData?.doctor?.first_name} {doctorData?.doctor?.last_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap bg-muted/30 p-6 rounded-lg">
                {insights}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          AI insights are powered by Lovable AI and provide data-driven recommendations based on appointment history, patient outcomes, and clinical performance metrics.
        </AlertDescription>
      </Alert>
    </div>
  );
};
