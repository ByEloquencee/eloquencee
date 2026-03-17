import { useState, useCallback } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PolishWord } from "@/data/words";
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

        <DialogContent className="max-w-2xl border-border bg-background p-0 sm:rounded-2xl">
          <div className="max-h-[85vh] overflow-y-auto scrollbar-none px-5 py-5 sm:px-6">
            <DialogHeader className="pb-4 text-left">
              <DialogTitle className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
                Więcej o słowie
              </DialogTitle>
              <DialogDescription>
                Dodatkowe informacje i kontekst użycia słowa.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <section className="rounded-2xl bg-secondary/50 p-4">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                  Słowo
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                  {word.word}
                </h2>
                {word.etymology && (
                  <p className="mt-2 text-sm italic text-muted-foreground">{word.etymology}</p>
                )}
              </section>

              <section className="rounded-2xl border border-border p-4">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                  Definicja
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {word.definition}
                </p>
              </section>

              <section className="rounded-2xl border border-border p-4">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                  Przykład
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed italic text-muted-foreground">
                  {word.example}
                </p>
              </section>

              <section className="rounded-2xl border border-border p-4">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                  Dodatkowe informacje
                </p>
                <div className="mt-3 text-sm leading-relaxed text-foreground">
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Ładowanie...</span>
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
