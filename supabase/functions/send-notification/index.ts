import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  recipient_type: "user" | "role" | "patient";
  recipient_ids?: string[];
  role?: string;
  notification_type: "email" | "sms" | "internal";
  subject?: string;
  body: string;
  template_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const {
      recipient_type,
      recipient_ids,
      role,
      notification_type,
      subject,
      body,
      template_id,
    }: NotificationRequest = await req.json();

    console.log("Processing notification request:", {
      recipient_type,
      recipient_ids,
      role,
      notification_type,
    });

    let recipientsList: string[] = [];

    // Determine recipients based on type
    if (recipient_type === "role" && role) {
      // Get all users with the specified role
      const { data: roleUsers, error: roleError } = await supabaseClient
        .from("user_roles")
        .select("user_id")
        .eq("role", role);

      if (roleError) throw roleError;
      recipientsList = roleUsers?.map((r) => r.user_id) || [];
      console.log(`Found ${recipientsList.length} users with role ${role}`);
    } else if (recipient_type === "user" && recipient_ids) {
      recipientsList = recipient_ids;
    } else if (recipient_type === "patient" && recipient_ids) {
      recipientsList = recipient_ids;
    }

    if (recipientsList.length === 0) {
      throw new Error("No recipients found");
    }

    // Get recipient details for each recipient
    const notifications: any[] = [];
    for (const recipientId of recipientsList) {
      let recipientEmail = null;
      let recipientPhone = null;
      let recipientName = "";

      if (recipient_type === "patient") {
        const { data: patient } = await supabaseClient
          .from("patients")
          .select("email, phone_mobile, first_name, last_name")
          .eq("id", recipientId)
          .single();

        if (patient) {
          recipientEmail = patient.email;
          recipientPhone = patient.phone_mobile;
          recipientName = `${patient.first_name} ${patient.last_name}`;
        }
      } else {
        // User or role-based
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("first_name, last_name, phone_mobile")
          .eq("id", recipientId)
          .single();

        const { data: authUser } = await supabaseClient.auth.admin.getUserById(recipientId);

        if (profile && authUser.user) {
          recipientEmail = authUser.user.email;
          recipientPhone = profile.phone_mobile;
          recipientName = `${profile.first_name} ${profile.last_name}`;
        }
      }

      // Personalize the body if needed
      let personalizedBody = body
        .replace(/{{name}}/g, recipientName)
        .replace(/{{first_name}}/g, recipientName.split(" ")[0]);

      // Create notification log entry
      const notificationData: any = {
        recipient_type,
        recipient_id: recipientId,
        notification_type,
        subject,
        body: personalizedBody,
        template_id,
        status: "pending",
        user_id: recipient_type !== "patient" ? recipientId : null, // Add user_id for staff notifications
        metadata: {
          recipient_email: recipientEmail,
          recipient_phone: recipientPhone,
          recipient_name: recipientName,
          role: recipient_type === "role" ? role : null,
        },
      };

      notifications.push(notificationData);

      // For demo purposes, we'll mark as sent immediately
      // In production, this would integrate with actual email/SMS services
      notificationData.status = "sent";
      notificationData.sent_at = new Date().toISOString();

      // If it's email and we have an email, mark as delivered (demo)
      if (notification_type === "email" && recipientEmail) {
        notificationData.delivered_at = new Date().toISOString();
        notificationData.status = "delivered";
      }

      // If it's SMS and we have a phone, mark as delivered (demo)
      if (notification_type === "sms" && recipientPhone) {
        notificationData.delivered_at = new Date().toISOString();
        notificationData.status = "delivered";
      }

      // For internal notifications, always mark as delivered
      if (notification_type === "internal") {
        notificationData.delivered_at = new Date().toISOString();
        notificationData.status = "delivered";
      }
    }

    // Insert all notifications
    const { data: insertedNotifications, error: insertError } = await supabaseClient
      .from("notifications_log")
      .insert(notifications)
      .select();

    if (insertError) {
      console.error("Error inserting notifications:", insertError);
      throw insertError;
    }

    console.log(`Successfully created ${insertedNotifications?.length || 0} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        count: insertedNotifications?.length || 0,
        notifications: insertedNotifications,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
