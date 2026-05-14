import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PolishWord } from "@/data/words";

export interface SponsoredWord {
  id: string;
  sponsor_name: string;
  word: string;
  part_of_speech: string;
  definition: string;
  example: string;
  etymology: string | null;
  link: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSponsoredWords() {
  const [sponsoredWords, setSponsoredWords] = useState<SponsoredWord[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data } = await (supabase
      .from("sponsored_words" as any)
      .select("*")
      .order("created_at", { ascending: false }) as any);
    setSponsoredWords((data as SponsoredWord[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateSponsored = useCallback(
    async (id: string, patch: Partial<Omit<SponsoredWord, "id" | "created_at" | "updated_at">>) => {
      const { error } = await (supabase
        .from("sponsored_words" as any)
        .update({ ...patch, updated_at: new Date().toISOString() } as any)
        .eq("id", id) as any);
      if (error) throw error;
      await refetch();
    },
    [refetch],
  );

  // Convert active sponsors to PolishWord format for injection into the feed.
  const asPolishWords: PolishWord[] = sponsoredWords
    .filter((s) => s.active)
    .map((s) => ({
      id: `sponsored-${s.id}`,
      word: s.word,
      partOfSpeech: s.part_of_speech || "reklama",
      definition: s.definition,
      example: s.example,
      etymology: s.etymology || undefined,
      category: "ogólne",
      isSponsored: true,
      sponsorName: s.sponsor_name,
      sponsorLink: s.link || undefined,
    }));

  return { sponsoredWords, asPolishWords, loading, updateSponsored, refetch };
}
