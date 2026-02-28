import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { PolishWord, WordCategory } from "@/data/words";

export function useCustomWords() {
  const { user } = useAuth();
  const [customWords, setCustomWords] = useState<PolishWord[]>([]);

  const fetchCustomWords = useCallback(async () => {
    if (!user) {
      setCustomWords([]);
      return;
    }
    const { data } = await supabase
      .from("custom_words")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setCustomWords(
        data.map((w) => ({
          id: `custom-${w.id}`,
          word: w.word,
          partOfSpeech: w.part_of_speech,
          definition: w.definition,
          example: w.example,
          etymology: w.etymology || undefined,
          category: w.category as WordCategory,
        }))
      );
    }
  }, [user]);

  useEffect(() => {
    fetchCustomWords();
  }, [fetchCustomWords]);

  const deleteWord = useCallback(async (wordId: string) => {
    const dbId = wordId.replace("custom-", "");
    const { error } = await supabase.from("custom_words").delete().eq("id", dbId);
    if (error) throw error;
    await fetchCustomWords();
  }, [fetchCustomWords]);

  const updateWord = useCallback(async (wordId: string, updates: {
    word: string;
    part_of_speech: string;
    definition: string;
    example: string;
    etymology: string | null;
    category: string;
  }) => {
    const dbId = wordId.replace("custom-", "");
    const { error } = await supabase.from("custom_words").update(updates).eq("id", dbId);
    if (error) throw error;
    await fetchCustomWords();
  }, [fetchCustomWords]);

  return { customWords, refetch: fetchCustomWords, deleteWord, updateWord };
}
