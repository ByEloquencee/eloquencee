import { useState, useCallback } from "react";
import type { DayRecord } from "@/hooks/use-learning-history";

const STORAGE_KEY = "eloquencee-daily-views";

function getStoredViews(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function cleanOldEntries(views: Record<string, number>): Record<string, number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 10);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const cleaned: Record<string, number> = {};
  for (const [date, count] of Object.entries(views)) {
    if (date >= cutoffStr) cleaned[date] = count;
  }
  return cleaned;
}

export function useWeeklyViews() {
  const [weekViewData, setWeekViewData] = useState<DayRecord[]>(() => buildWeek());

  function buildWeek(): DayRecord[] {
    const views = getStoredViews();
    const days: DayRecord[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: views[key] ?? 0 });
    }
    return days;
  }

  const incrementView = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const views = getStoredViews();
    views[today] = (views[today] ?? 0) + 1;
    const cleaned = cleanOldEntries(views);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    setWeekViewData(buildWeek());
  }, []);

  return { weekViewData, incrementView };
}
