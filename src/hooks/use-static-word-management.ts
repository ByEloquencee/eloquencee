import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StaticWordOverride {
  word_id: string;
  word?: string | null;
  part_of_speech?: string | null;
  definition?: string | null;
  example?: string | null;
  etymology?: string | null;
  category?: string | null;
  difficulty?: string | null;
}

export function useStaticWordManagement() {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Map<string, StaticWordOverride>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [hiddenRes, overridesRes] = await Promise.all([
      supabase.from("hidden_static_words" as any).select("word_id") as any,
      supabase.from("static_word_overrides" as any).select("*") as any,
    ]);

    setHiddenIds(new Set((hiddenRes.data || []).map((r: any) => r.word_id)));

    const map = new Map<string, StaticWordOverride>();
    for (const o of (overridesRes.data || []) as any[]) {
      map.set(o.word_id, o);
    }
    setOverrides(map);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const hideWord = useCallback(async (wordId: string, userId?: string) => {
    const { error } = await (supabase.from("hidden_static_words" as any).insert({ word_id: wordId, hidden_by: userId || null }) as any);
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  const unhideWord = useCallback(async (wordId: string) => {
    const { error } = await (supabase.from("hidden_static_words" as any).delete().eq("word_id", wordId) as any);
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  const saveOverride = useCallback(async (override: StaticWordOverride & { updated_by?: string | null }) => {
    const { error } = await (supabase.from("static_word_overrides" as any).upsert(override as any, { onConflict: "word_id" }) as any);
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  const deleteOverride = useCallback(async (wordId: string) => {
    const { error } = await (supabase.from("static_word_overrides" as any).delete().eq("word_id", wordId) as any);
    if (error) throw error;
    await fetchAll();
  }, [fetchAll]);

  return { hiddenIds, overrides, loading, hideWord, unhideWord, saveOverride, deleteOverride, refetch: fetchAll };
}
