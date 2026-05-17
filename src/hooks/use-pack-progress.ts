import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function usePackProgress(packId: string | null) {
  const { user } = useAuth();
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!packId || !user) {
      setMasteredIds(new Set());
      return;
    }
    let cancel = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("pack_progress")
        .select("word_id")
        .eq("user_id", user.id)
        .eq("pack_id", packId);
      if (cancel) return;
      setMasteredIds(new Set((data || []).map((r) => r.word_id)));
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [packId, user]);

  const markRevealed = useCallback(async (wordId: string) => {
    if (!packId || !user) return;
    if (masteredIds.has(wordId)) return;
    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.add(wordId);
      return next;
    });
    await supabase
      .from("pack_progress")
      .insert({ user_id: user.id, pack_id: packId, word_id: wordId })
      .select();
  }, [packId, user, masteredIds]);

  return { masteredIds, masteredCount: masteredIds.size, markRevealed, loading };
}

// Hook bez subskrypcji — czytamy tylko liczbę opanowanych dla danej paczki
export function usePackProgressCount(packId: string) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }
    let cancel = false;
    (async () => {
      const { count: c } = await supabase
        .from("pack_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("pack_id", packId);
      if (!cancel) setCount(c || 0);
    })();
    return () => { cancel = true; };
  }, [packId, user]);

  return count;
}
