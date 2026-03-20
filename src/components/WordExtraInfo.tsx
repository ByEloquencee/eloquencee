import { useState, useCallback } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PolishWord } from "@/data/words";
import { formatAIText } from "@/lib/format-ai-text";
import type { DifficultyLevel } from "@/hooks/use-profile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WordExtraInfoProps {
  word: PolishWord;
  difficultyLevel: DifficultyLevel;
}

export function WordExtraInfo({ word, difficultyLevel }: WordExtraInfoProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchInfo = useCallback(async () => {
    if (loaded || loading) return;

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
  }, [word, difficultyLevel, loaded, loading]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        void fetchInfo();
      }
    },
    [fetchInfo],
  );

  return (
    <div className="mt-2">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <BookOpen size={14} />
            <span>Więcej o słowie</span>
          </button>
        </DialogTrigger>

        <DialogContent className="max-w-[340px] sm:max-w-sm border-border bg-background p-0 rounded-2xl shadow-xl">
          <div className="max-h-[70vh] overflow-y-auto scrollbar-none px-4 py-4">
            <DialogHeader className="pb-3 text-left">
              <DialogTitle className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
                {word.word}
              </DialogTitle>
              {word.etymology && (
                <DialogDescription className="text-xs italic">
                  {word.etymology}
                </DialogDescription>
              )}
              {!word.etymology && (
                <DialogDescription className="sr-only">Szczegóły słowa</DialogDescription>
              )}
            </DialogHeader>

            <div className="space-y-3">
              <section className="rounded-xl bg-secondary/40 px-3 py-2.5">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Definicja
                </p>
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-foreground">
                  {word.definition}
                </p>
              </section>

              <section className="rounded-xl bg-secondary/40 px-3 py-2.5">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Przykład
                </p>
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed italic text-muted-foreground">
                  „{word.example}"
                </p>
              </section>

              <section className="rounded-xl border border-border px-3 py-2.5">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Dodatkowe informacje
                </p>
                <div className="mt-1.5 text-[13px] leading-relaxed text-foreground">
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-2">
                      <Loader2 size={13} className="animate-spin" />
                      <span className="text-xs">Ładowanie...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line">{info}</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
