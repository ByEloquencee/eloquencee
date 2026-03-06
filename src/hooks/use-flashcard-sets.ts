import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { PolishWord, WordCategory } from "@/data/words";

export interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  icon: string;
  created_at: string;
  cards: PolishWord[];
}

export function useFlashcardSets() {
  const { user } = useAuth();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSets = useCallback(async () => {
    if (!user) {
      setSets([]);
      return;
    }
    setLoading(true);
    try {
      const { data: setsData } = await supabase
        .from("flashcard_sets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!setsData) return;

      const { data: wordsData } = await supabase
        .from("custom_words")
        .select("*")
        .eq("user_id", user.id)
        .not("set_id", "is", null);

      const wordsBySet = new Map<string, PolishWord[]>();
      wordsData?.forEach((w) => {
        const arr = wordsBySet.get(w.set_id!) || [];
        arr.push({
          id: `custom-${w.id}`,
          word: w.word,
          partOfSpeech: w.part_of_speech,
          definition: w.definition,
          example: w.example,
          etymology: w.etymology || undefined,
          category: w.category as WordCategory,
        });
        wordsBySet.set(w.set_id!, arr);
      });

      setSets(
        setsData.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          icon: (s as any).icon || "book-open",
          created_at: s.created_at,
          cards: wordsBySet.get(s.id) || [],
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  const createSet = useCallback(
    async (
      title: string,
      description: string,
      cards: { word: string; definition: string; partOfSpeech?: string; example?: string; etymology?: string }[],
      icon: string = "book-open"
    ) => {
      if (!user) throw new Error("Not authenticated");

      const { data: setData, error: setError } = await supabase
        .from("flashcard_sets")
        .insert({ user_id: user.id, title, description, icon } as any)
        .select()
        .single();

      if (setError || !setData) throw setError;

      if (cards.length > 0) {
        const { error: wordsError } = await supabase.from("custom_words").insert(
          cards.map((c) => ({
            user_id: user.id,
            word: c.word,
            definition: c.definition,
            part_of_speech: c.partOfSpeech || "",
            example: c.example || "",
            etymology: c.etymology || null,
            category: "własne" as const,
            set_id: setData.id,
          }))
        );
        if (wordsError) throw wordsError;
      }

      await fetchSets();
      return setData.id;
    },
    [user, fetchSets]
  );

  const deleteSet = useCallback(
    async (setId: string) => {
      const { error } = await supabase.from("flashcard_sets").delete().eq("id", setId);
      if (error) throw error;
      await fetchSets();
    },
    [fetchSets]
  );

  return { sets, loading, createSet, deleteSet, refetch: fetchSets };
}
