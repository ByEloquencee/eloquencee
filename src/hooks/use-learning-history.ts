import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface DayRecord {
  date: string;
  count: number;
}

export function useLearningHistory() {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState<DayRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setWeekData([]);
      setStreak(0);
      setLoading(false);
      return;
    }

    // Get last 30 days for streak calculation, but we'll display last 7
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().slice(0, 10);

    const { data } = await supabase
      .from("learning_history")
      .select("date, words_learned")
      .eq("user_id", user.id)
      .gte("date", dateStr)
      .order("date", { ascending: true });

    if (data) {
      // Build last 7 days
      const days: DayRecord[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const found = data.find((r) => r.date === key);
        days.push({ date: key, count: found?.words_learned ?? 0 });
      }
      setWeekData(days);

      // Calculate streak (consecutive days with words_learned > 0, ending today or yesterday)
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const dateSet = new Set(
        data.filter((r) => r.words_learned > 0).map((r) => r.date)
      );

      let s = 0;
      // Start from today, if no activity today try yesterday
      let checkDate = dateSet.has(today) ? new Date() : dateSet.has(yesterday) ? new Date(Date.now() - 86400000) : null;
      if (checkDate) {
        while (true) {
          const k = checkDate.toISOString().slice(0, 10);
          if (dateSet.has(k)) {
            s++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      setStreak(s);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Upsert today's count
  const recordToday = useCallback(
    async (wordsLearned: number) => {
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);

      // Use upsert with the unique constraint on (user_id, date)
      await supabase
        .from("learning_history")
        .upsert(
          { user_id: user.id, date: today, words_learned: wordsLearned },
          { onConflict: "user_id,date" }
        );

      // Re-fetch to keep state fresh
      fetchHistory();
    },
    [user, fetchHistory]
  );

  return { weekData, streak, loading, recordToday };
}
