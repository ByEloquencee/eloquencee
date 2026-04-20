import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { WordCategory } from "@/data/words";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface Profile {
  name: string;
  preferred_categories: WordCategory[];
  onboarding_done: boolean;
  daily_email_enabled: boolean;
  daily_goal: number;
  difficulty_level: DifficultyLevel;
  notifications_enabled: boolean;
  notification_hour_1: number;
  notification_hour_2: number | null;
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
      .select("name, preferred_categories, onboarding_done, daily_email_enabled, daily_goal, difficulty_level, notifications_enabled, notification_hour_1, notification_hour_2")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile({
        name: data.name,
        preferred_categories: (data.preferred_categories || []) as WordCategory[],
        onboarding_done: data.onboarding_done,
        daily_email_enabled: data.daily_email_enabled,
        daily_goal: data.daily_goal ?? 5,
        difficulty_level: (data.difficulty_level as DifficultyLevel) || "advanced",
        notifications_enabled: data.notifications_enabled ?? false,
        notification_hour_1: data.notification_hour_1 ?? 8,
        notification_hour_2: data.notification_hour_2 ?? null,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Pick<Profile, "name" | "preferred_categories" | "onboarding_done" | "daily_email_enabled" | "daily_goal" | "difficulty_level" | "notifications_enabled" | "notification_hour_1" | "notification_hour_2">>) => {
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
