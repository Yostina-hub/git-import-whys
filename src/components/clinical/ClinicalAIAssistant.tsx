import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, AlertCircle, TrendingUp, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClinicalAIAssistantProps {
  patientData: {
    patient: any;
    stats: any;
    allergies: any[];
    medications: any[];
    recentNotes: any[];
    recentVitals: any[];
  };
}

export const ClinicalAIAssistant = ({ patientData }: ClinicalAIAssistantProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "recommendations" | "risk_assessment">("summary");

  const analyzePatient = async (analysisType: "summary" | "recommendations" | "risk_assessment") => {
    setLoading(true);
    setAnalysis("");
    setActiveTab(analysisType);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clinical-analysis`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          patientData,
          analysisType,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limits exceeded, please try again later.");
        }
        if (response.status === 402) {
          throw new Error("Payment required, please add funds to your workspace.");
        }
        throw new Error("Failed to start analysis");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              setAnalysis((prev) => prev + content);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) setAnalysis((prev) => prev + content);
          } catch { /* ignore */ }
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Clinical Insights</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Powered by Gemini
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            AI-generated insights are for informational purposes only. Always verify with clinical judgment.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary" className="gap-2">
              <FileText className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="risk_assessment" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Risk Assessment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            {!analysis && !loading && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a comprehensive clinical summary
                </p>
                <Button onClick={() => analyzePatient("summary")} disabled={loading}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Summary
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {!analysis && !loading && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Get AI-powered clinical recommendations
                </p>
                <Button onClick={() => analyzePatient("recommendations")} disabled={loading}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Recommendations
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="risk_assessment" className="space-y-4">
            {!analysis && !loading && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Analyze potential health risks
                </p>
                <Button onClick={() => analyzePatient("risk_assessment")} disabled={loading}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Assess Risks
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Analyzing patient data...</span>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4">
              <div className="whitespace-pre-wrap text-sm">{analysis}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => analyzePatient(activeTab)}
              className="w-full"
            >
              Regenerate Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
