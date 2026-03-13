import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { DayRecord } from "@/hooks/use-learning-history";

export function useWeeklyFavorites() {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<DayRecord[]>([]);

  const fetchWeekData = useCallback(async () => {
    // Build last 7 days
    const days: DayRecord[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }

    if (!user) {
      setWeekData(days);
      return;
    }

    const sevenDaysAgo = days[0].date + "T00:00:00Z";

    const { data } = await supabase
      .from("favorites")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo);

    if (data) {
      const countsByDate: Record<string, number> = {};
      for (const row of data) {
        const dateKey = row.created_at.slice(0, 10);
        countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1;
      }
      for (const day of days) {
        day.count = countsByDate[day.date] || 0;
      }
    }

    setWeekData(days);
  }, [user]);

  useEffect(() => {
    fetchWeekData();
  }, [fetchWeekData]);

  return { weekFavData: weekData, refetchWeekFav: fetchWeekData };
}
