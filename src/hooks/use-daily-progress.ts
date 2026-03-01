import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const TODAY_PROGRESS_KEY = "eloquencee-daily-progress";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadTodayCount(): number {
  try {
    const stored = JSON.parse(localStorage.getItem(TODAY_PROGRESS_KEY) || "{}");
    return stored.date === getTodayKey() ? stored.count : 0;
  } catch {
    return 0;
  }
}

function saveTodayCount(count: number) {
  localStorage.setItem(TODAY_PROGRESS_KEY, JSON.stringify({ date: getTodayKey(), count }));
}

export function useDailyProgress() {
  const { user } = useAuth();
  const [count, setCount] = useState(loadTodayCount);

  // On login, check cloud favorites added today
  useEffect(() => {
    if (!user) return;
    supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", getTodayKey() + "T00:00:00Z")
      .then(({ count: cloudCount }) => {
        if (cloudCount != null && cloudCount > 0) {
          setCount((prev) => {
            const merged = Math.max(prev, cloudCount);
            saveTodayCount(merged);
            return merged;
          });
        }
      });
  }, [user]);

  const increment = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      saveTodayCount(next);
      return next;
    });
  }, []);

  const decrement = useCallback(() => {
    setCount((prev) => {
      const next = Math.max(0, prev - 1);
      saveTodayCount(next);
      return next;
    });
  }, []);

  return { todayCount: count, increment, decrement };
}
