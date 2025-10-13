import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { consultationId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get consultation details
    const { data: consultation } = await supabase
      .from('online_consultations')
      .select(`
        *,
        patients (first_name, last_name, date_of_birth),
        consultation_messages (content, sender_type, created_at),
        consultation_prescriptions (medications, diagnosis, instructions)
      `)
      .eq('id', consultationId)
      .single();

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    // Prepare messages for AI
    const messages = consultation.consultation_messages
      .filter((m: any) => m.message_type === 'text')
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((m: any) => `${m.sender_type === 'doctor' ? 'Doctor' : 'Patient'}: ${m.content}`)
      .join('\n');

    // Call Lovable AI to generate summary
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant. Generate a concise clinical consultation summary including: chief complaint, key symptoms discussed, diagnosis, treatment plan, and follow-up recommendations. Keep it professional and structured.'
          },
          {
            role: 'user',
            content: `Generate a consultation summary based on this conversation:\n\n${messages}\n\nPrescriptions: ${JSON.stringify(consultation.consultation_prescriptions)}`
          }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0]?.message?.content || 'Unable to generate summary';

    // Update consultation with AI summary
    await supabase
      .from('online_consultations')
      .update({ ai_summary: summary })
      .eq('id', consultationId);

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
