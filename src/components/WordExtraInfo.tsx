import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PolishWord } from "@/data/words";
import type { DifficultyLevel } from "@/hooks/use-profile";

interface WordExtraInfoProps {
  word: PolishWord;
  difficultyLevel: DifficultyLevel;
}

export function WordExtraInfo({ word, difficultyLevel }: WordExtraInfoProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchInfo = useCallback(async () => {
    if (loaded) {
      setExpanded((v) => !v);
      return;
    }
    setExpanded(true);
    setLoading(true);
    try {
      const levelLabels: Record<DifficultyLevel, string> = {
        beginner: "początkujący - używaj prostego języka, krótkich zdań",
        intermediate: "średnio zaawansowany - normalne objaśnienia",
        advanced: "zaawansowany - pełne, szczegółowe objaśnienia",
      };
      const { data, error } = await supabase.functions.invoke("word-extra-info", {
        body: {
          word: word.word,
          definition: word.definition,
          etymology: word.etymology || "",
          category: word.category,
          difficulty: levelLabels[difficultyLevel],
        },
      });
      if (error) throw error;
      setInfo(data?.info || "Brak dodatkowych informacji.");
      setLoaded(true);
    } catch {
      setInfo("Nie udało się pobrać dodatkowych informacji.");
    } finally {
      setLoading(false);
    }
  }, [word, difficultyLevel, loaded]);

  return (
    <div className="mt-2">
      <button
        onClick={fetchInfo}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <BookOpen size={14} />
        <span>Więcej o słowie</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 rounded-xl bg-secondary/50 text-sm leading-relaxed text-foreground">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Ładowanie...</span>
                </div>
              ) : (
                <div className="whitespace-pre-line">{info}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
