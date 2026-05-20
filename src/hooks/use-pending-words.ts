import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PendingWord {
  id: string;
  word: string;
  part_of_speech: string;
  definition: string;
  simplified_definition: string;
  example_sentence: string;
  etymology: string | null;
  dictionary_source: string;
  source_url: string | null;
  stylistic_tags: string[];
  difficulty_level: string;
  category: string;
  ai_confidence_score: number | null;
  created_by_ai: boolean;
  verification_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  batch_id: string | null;
  batch_prompt: string | null;
  created_at: string;
  created_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  published_word_id: string | null;
}

export type PendingStatusFilter = "pending" | "approved" | "rejected" | "all";

export function usePendingWords(status: PendingStatusFilter = "pending") {
  const [pending, setPending] = useState<PendingWord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = (supabase.from("pending_words" as any) as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (status !== "all") q = q.eq("verification_status", status);
    const { data } = await q;
    setPending(((data as PendingWord[]) || []));
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    const channel = supabase
      .channel("pending_words_changes")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "pending_words" },
        () => fetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch]);

  const approve = useCallback(async (id: string) => {
    const { error } = await (supabase as any).rpc("approve_pending_word", { _id: id });
    if (error) throw error;
    await fetch();
  }, [fetch]);

  const reject = useCallback(async (id: string, reason?: string) => {
    const { error } = await (supabase.from("pending_words" as any) as any)
      .update({ verification_status: "rejected", rejection_reason: reason || null })
      .eq("id", id);
    if (error) throw error;
    await fetch();
  }, [fetch]);

  const update = useCallback(async (id: string, patch: Partial<PendingWord>) => {
    const { error } = await (supabase.from("pending_words" as any) as any).update(patch as any).eq("id", id);
    if (error) throw error;
    await fetch();
  }, [fetch]);

  const remove = useCallback(async (id: string) => {
    const { error } = await (supabase.from("pending_words" as any) as any).delete().eq("id", id);
    if (error) throw error;
    await fetch();
  }, [fetch]);

  const regenerate = useCallback(async (id: string) => {
    const { error } = await supabase.functions.invoke("regenerate-pending-word", { body: { id } });
    if (error) throw error;
    await fetch();
  }, [fetch]);

  return { pending, loading, approve, reject, update, remove, regenerate, refetch: fetch };
}
