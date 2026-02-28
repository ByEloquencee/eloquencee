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

  return { customWords, refetch: fetchCustomWords };
}
