import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PolishWord, WordCategory } from "@/data/words";

export interface GlobalWord {
  id: string;
  word: string;
  part_of_speech: string;
  definition: string;
  example: string;
  etymology: string | null;
  category: string;
  difficulty: string;
  created_at: string;
}

export function useGlobalWords() {
  const [globalWords, setGlobalWords] = useState<GlobalWord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await (supabase
      .from("global_words" as any)
      .select("*")
      .order("created_at", { ascending: false }) as any);
    setGlobalWords((data as GlobalWord[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addWord = useCallback(async (word: Omit<GlobalWord, "id" | "created_at">) => {
    const { error } = await supabase.from("global_words").insert(word);
    if (error) throw error;
    await fetch();
  }, [fetch]);

  const deleteWord = useCallback(async (id: string) => {
    const { error } = await supabase.from("global_words").delete().eq("id", id);
    if (error) throw error;
    await fetch();
  }, [fetch]);

  // Convert to PolishWord format for display
  const asPolishWords: PolishWord[] = globalWords.map((w) => ({
    id: `global-${w.id}`,
    word: w.word,
    partOfSpeech: w.part_of_speech,
    definition: w.definition,
    example: w.example,
    etymology: w.etymology || undefined,
    category: w.category as WordCategory,
  }));

  return { globalWords, asPolishWords, loading, addWord, deleteWord, refetch: fetch };
}
