import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check DB first for manually granted premium (no Stripe needed)
    const { data: dbSub } = await supabaseClient
      .from("subscriptions")
      .select("status, plan, current_period_end, stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (dbSub && dbSub.status === "active" && dbSub.plan === "premium" && !dbSub.stripe_customer_id) {
      logStep("Manual premium found in DB");
      return new Response(JSON.stringify({
        subscribed: true,
        plan: "premium",
        subscription_end: dbSub.current_period_end,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      // Check for one-time support payments that grant premium
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Check active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const sub = subscriptions.data[0];
      subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: sub.id });

      // Update subscriptions table
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        status: "active",
        plan: "premium",
        current_period_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } else {
      // Check for completed support payments
      const payments = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 10,
      });

      const supportPayment = payments.data.find(
        (pi) => pi.status === "succeeded" && pi.metadata?.type === "support"
      );

      if (supportPayment) {
        logStep("Support payment found, granting premium");
        await supabaseClient.from("subscriptions").upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          status: "active",
          plan: "premium",
          support_amount: supportPayment.amount,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        return new Response(JSON.stringify({
          subscribed: true,
          plan: "premium",
          type: "support",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      logStep("No active subscription");
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: "inactive",
        plan: "free",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan: hasActiveSub ? "premium" : "free",
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
