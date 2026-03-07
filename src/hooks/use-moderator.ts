import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useModerator() {
  const { user } = useAuth();
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRole = useCallback(async () => {
    if (!user) {
      setIsModerator(false);
      setLoading(false);
      return;
    }
    const { data } = await (supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "moderator")
      .maybeSingle() as any);

    setIsModerator(!!data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    checkRole();
  }, [checkRole]);

  return { isModerator, loading };
}
