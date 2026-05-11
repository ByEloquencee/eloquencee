import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const LS_KEY = "pack_progress_v1";

type ProgressMap = Record<string, number>; // pack_id -> highest_completed_level

function readLocal(): ProgressMap {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocal(map: ProgressMap) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {}
}

export function usePackProgress(packId: string) {
  const { user } = useAuth();
  const [highestCompleted, setHighestCompleted] = useState<number>(() => readLocal()[packId] ?? 0);
  const [loading, setLoading] = useState(false);

  // Wczytaj z chmury jeśli zalogowany
  useEffect(() => {
    if (!user) {
      setHighestCompleted(readLocal()[packId] ?? 0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("pack_progress")
      .select("highest_completed_level")
      .eq("user_id", user.id)
      .eq("pack_id", packId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const cloud = data?.highest_completed_level ?? 0;
        const local = readLocal()[packId] ?? 0;
        const merged = Math.max(cloud, local);
        setHighestCompleted(merged);
        if (merged !== cloud) {
          // Pchnij lokalny postęp do chmury
          supabase.from("pack_progress").upsert(
            { user_id: user.id, pack_id: packId, highest_completed_level: merged, updated_at: new Date().toISOString() },
            { onConflict: "user_id,pack_id" }
          ).then(() => {});
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, packId]);

  const completeLevel = useCallback(
    async (level: number) => {
      const next = Math.max(highestCompleted, level);
      if (next === highestCompleted) return;
      setHighestCompleted(next);
      const local = readLocal();
      local[packId] = next;
      writeLocal(local);
      if (user) {
        await supabase.from("pack_progress").upsert(
          { user_id: user.id, pack_id: packId, highest_completed_level: next, updated_at: new Date().toISOString() },
          { onConflict: "user_id,pack_id" }
        );
      }
    },
    [highestCompleted, packId, user]
  );

  return { highestCompleted, completeLevel, loading };
}
