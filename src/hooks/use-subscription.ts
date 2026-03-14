import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface SubscriptionState {
  isPremium: boolean;
  plan: "free" | "premium";
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    plan: "free",
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user || !session) {
      setState({ isPremium: false, plan: "free", subscriptionEnd: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setState({
        isPremium: data?.subscribed === true,
        plan: data?.plan === "premium" ? "premium" : "free",
        subscriptionEnd: data?.subscription_end || null,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [user, session]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  // Check on checkout success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      // Remove param and recheck
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(checkSubscription, 2000);
    }
  }, [checkSubscription]);

  const startCheckout = useCallback(async (mode: "subscription" | "support" = "subscription", supportAmount?: number) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { mode, support_amount: supportAmount },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      throw new Error(err.message || "Nie udało się otworzyć płatności");
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      throw new Error(err.message || "Nie udało się otworzyć portalu");
    }
  }, []);

  return { ...state, checkSubscription, startCheckout, openPortal };
}
