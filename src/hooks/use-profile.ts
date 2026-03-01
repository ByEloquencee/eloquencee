import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { WordCategory } from "@/data/words";

export interface Profile {
  name: string;
  preferred_categories: WordCategory[];
  onboarding_done: boolean;
  daily_email_enabled: boolean;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("name, preferred_categories, onboarding_done, daily_email_enabled")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile({
        name: data.name,
        preferred_categories: (data.preferred_categories || []) as WordCategory[],
        onboarding_done: data.onboarding_done,
        daily_email_enabled: data.daily_email_enabled,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Pick<Profile, "name" | "preferred_categories" | "onboarding_done" | "daily_email_enabled">>) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    if (error) throw error;
    await fetchProfile();
  }, [user, fetchProfile]);

  return { profile, loading: loading, updateProfile, refetch: fetchProfile };
}
