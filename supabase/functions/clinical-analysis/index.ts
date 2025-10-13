import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientData, analysisType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build comprehensive patient context
    const patientContext = `
Patient Overview:
- Name: ${patientData.patient?.first_name} ${patientData.patient?.last_name}
- MRN: ${patientData.patient?.mrn}
- Age: ${patientData.patient?.age || 'Unknown'}
- Total Visits: ${patientData.stats?.totalVisits || 0}
- Total Clinical Notes: ${patientData.stats?.totalNotes || 0}

${patientData.allergies?.length > 0 ? `
Allergies (${patientData.allergies.length}):
${patientData.allergies.map((a: any) => `- ${a.allergen} (${a.severity}): ${a.reaction}`).join('\n')}
` : 'No known allergies recorded.'}

${patientData.medications?.length > 0 ? `
Active Medications (${patientData.medications.length}):
${patientData.medications.map((m: any) => `- ${m.medication_name}: ${m.dosage} (${m.frequency})`).join('\n')}
` : 'No active medications.'}

${patientData.recentNotes?.length > 0 ? `
Recent Clinical Notes:
${patientData.recentNotes.map((n: any) => `[${new Date(n.created_at).toLocaleDateString()}] ${n.note_type}: ${n.content.substring(0, 200)}...`).join('\n\n')}
` : 'No recent clinical notes.'}

${patientData.recentVitals?.length > 0 ? `
Recent Vital Signs:
${patientData.recentVitals.map((v: any) => `- ${v.vital_type}: ${v.value} (${new Date(v.recorded_at).toLocaleDateString()})`).join('\n')}
` : ''}
`;

    let systemPrompt = "";
    let userPrompt = "";

    switch (analysisType) {
      case "summary":
        systemPrompt = "You are a clinical assistant AI that provides concise, actionable medical summaries. Focus on key health indicators, trends, and important observations. Be professional and clinical in tone.";
        userPrompt = `Please provide a comprehensive clinical summary for this patient. Highlight:
1. Key health concerns or risk factors
2. Medication management insights
3. Notable trends or patterns
4. Recommended follow-up actions

${patientContext}`;
        break;

      case "recommendations":
        systemPrompt = "You are a clinical decision support AI. Provide evidence-based recommendations while being clear that final decisions should be made by healthcare professionals.";
        userPrompt = `Based on this patient's clinical data, provide recommendations for:
1. Preventive care measures
2. Areas requiring closer monitoring
3. Potential medication interactions or concerns
4. Suggested clinical assessments or tests

${patientContext}`;
        break;

      case "risk_assessment":
        systemPrompt = "You are a medical risk assessment AI. Analyze patient data to identify potential health risks and areas of concern.";
        userPrompt = `Analyze this patient's data for potential health risks:
1. Identify any red flags in medications, allergies, or vitals
2. Assess medication interaction risks
3. Note any concerning trends
4. Highlight areas requiring immediate attention

${patientContext}`;
        break;

      default:
        systemPrompt = "You are a helpful clinical AI assistant.";
        userPrompt = patientContext;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Clinical analysis error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
