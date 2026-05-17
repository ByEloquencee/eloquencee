import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { words as builtInWords, type PolishWord, type WordCategory } from "@/data/words";
import { useGlobalWords } from "@/hooks/use-global-words";
import { useStaticWordManagement } from "@/hooks/use-static-word-management";

export const PREMIUM_PACK_IDS = new Set(["showbiznes", "muzyka", "archaizmy", "nauka", "sport"]);

interface Override {
  pack_id: string;
  word_id: string;
  action: "include" | "exclude";
}

interface PremiumWordRow {
  id: string;
  pack_id: string;
  word: string;
  part_of_speech: string;
  definition: string;
  example: string;
  etymology: string | null;
  difficulty: string;
}

export function usePackWords(packId: string | null) {
  const { asPolishWords: globalPolishWords } = useGlobalWords();
  const { hiddenIds, overrides: staticOverrides } = useStaticWordManagement();
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [premiumRows, setPremiumRows] = useState<PremiumWordRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!packId) return;
    let cancel = false;
    setLoading(true);
    (async () => {
      const [{ data: ovr }, { data: prem }] = await Promise.all([
        supabase.from("pack_word_overrides").select("*").eq("pack_id", packId),
        PREMIUM_PACK_IDS.has(packId)
          ? supabase.from("pack_premium_words").select("*").eq("pack_id", packId)
          : Promise.resolve({ data: [] as PremiumWordRow[] }),
      ]);
      if (cancel) return;
      setOverrides((ovr || []) as Override[]);
      setPremiumRows((prem || []) as PremiumWordRow[]);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [packId]);

  const packWords = useMemo<PolishWord[]>(() => {
    if (!packId) return [];

    const excludeIds = new Set(overrides.filter((o) => o.action === "exclude").map((o) => o.word_id));
    const includeIds = new Set(overrides.filter((o) => o.action === "include").map((o) => o.word_id));

    if (PREMIUM_PACK_IDS.has(packId)) {
      // Premium pack — słowa z pack_premium_words + ewentualne include z innych źródeł
      const base: PolishWord[] = premiumRows
        .filter((r) => !excludeIds.has(`premium-${r.id}`))
        .map((r) => ({
          id: `premium-${r.id}`,
          word: r.word,
          partOfSpeech: r.part_of_speech,
          definition: r.definition,
          example: r.example,
          etymology: r.etymology || undefined,
          category: "ogólne" as WordCategory,
          difficulty: (r.difficulty as PolishWord["difficulty"]) || "advanced",
        }));
      return base;
    }

    // Kategoria z bazy: filtr po category w built-in + global_words
    const filteredBuiltIn = builtInWords
      .filter((w) => !hiddenIds.has(w.id))
      .map((w) => {
        const ov = staticOverrides.get(w.id);
        if (!ov) return w;
        return {
          ...w,
          word: ov.word || w.word,
          partOfSpeech: ov.part_of_speech || w.partOfSpeech,
          definition: ov.definition || w.definition,
          example: ov.example || w.example,
          etymology: ov.etymology || w.etymology,
          category: (ov.category as WordCategory) || w.category,
          difficulty: (ov.difficulty as PolishWord["difficulty"]) || w.difficulty,
        } as PolishWord;
      });

    const builtInNames = new Set(filteredBuiltIn.map((w) => w.word.toLowerCase().trim()));
    const uniqueGlobal = globalPolishWords.filter((w) => !builtInNames.has(w.word.toLowerCase().trim()));

    const combined = [...filteredBuiltIn, ...uniqueGlobal].filter((w) => {
      if (excludeIds.has(w.id)) return false;
      if (includeIds.has(w.id)) return true;
      return w.category === packId;
    });

    return combined;
  }, [packId, overrides, premiumRows, globalPolishWords, hiddenIds, staticOverrides]);

  return { words: packWords, loading };
}
