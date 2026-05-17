import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, BookOpen, Play, Sparkles } from "lucide-react";
import { FlashcardStudyView } from "@/components/FlashcardStudyView";
import { usePackWords } from "@/hooks/use-pack-words";
import { usePackProgress } from "@/hooks/use-pack-progress";
import type { FlashcardSet } from "@/hooks/use-flashcard-sets";

interface PackDetailViewProps {
  packId: string;
  packLabel: string;
  onClose: () => void;
}

export function PackDetailView({ packId, packLabel, onClose }: PackDetailViewProps) {
  const { words, loading } = usePackWords(packId);
  const { masteredIds, masteredCount, markRevealed } = usePackProgress(packId);
  const [studyMode, setStudyMode] = useState<"session" | "browse" | null>(null);

  const total = words.length;
  const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;

  const sessionCards = useMemo(() => {
    if (total === 0) return [];
    const unmastered = words.filter((w) => !masteredIds.has(w.id));
    const pool = unmastered.length >= 10 ? unmastered : [...unmastered, ...words.filter((w) => masteredIds.has(w.id))];
    return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(10, pool.length));
  }, [words, masteredIds, total]);

  const studySet = useMemo<FlashcardSet | null>(() => {
    if (!studyMode) return null;
    const cards = studyMode === "session" ? sessionCards : words;
    if (cards.length === 0) return null;
    return {
      id: `pack-${packId}`,
      title: packLabel,
      description: studyMode === "session" ? "Sesja nauki" : "Przeglądaj wszystkie",
      icon: "book-open",
      created_at: new Date().toISOString(),
      cards,
    };
  }, [studyMode, sessionCards, words, packId, packLabel]);

  if (studySet) {
    return (
      <FlashcardStudyView
        set={studySet}
        onExit={() => setStudyMode(null)}
        onCardReveal={(wordId) => { void markRevealed(wordId); }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-background flex flex-col"
    >
      <header className="w-full max-w-lg mx-auto px-4 pt-[max(env(safe-area-inset-top),3rem)] pb-4 flex items-center gap-2">
        <button
          onClick={onClose}
          className="p-1 -ml-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Wstecz"
        >
          <ChevronLeft size={28} strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate" style={{ fontFamily: "var(--font-display)" }}>
            {packLabel}
          </h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "Wczytywanie..." : `${masteredCount} / ${total} opanowanych`}
          </p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="w-full max-w-lg mx-auto space-y-6">
          {/* Pasek postępu */}
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{pct}% opanowanych</span>
              <span>{total} słów</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-1 gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setStudyMode("session")}
              disabled={total === 0}
              className="w-full p-5 rounded-2xl bg-primary text-primary-foreground flex items-center gap-4 hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={22} fill="currentColor" />
              <div className="text-left flex-1">
                <p className="font-semibold text-base">Rozpocznij sesję</p>
                <p className="text-xs opacity-80">10 słów, priorytet nieopanowane</p>
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setStudyMode("browse")}
              disabled={total === 0}
              className="w-full p-5 rounded-2xl bg-secondary text-secondary-foreground flex items-center gap-4 hover:bg-secondary/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BookOpen size={22} />
              <div className="text-left flex-1">
                <p className="font-semibold text-base">Przeglądaj wszystkie</p>
                <p className="text-xs text-muted-foreground">Wszystkie {total} słów w paczce</p>
              </div>
            </motion.button>
          </div>

          {/* Lista słów */}
          {total > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-1">
                Słowa w paczce
              </p>
              <div className="space-y-1.5">
                {words.map((w) => {
                  const mastered = masteredIds.has(w.id);
                  return (
                    <div
                      key={w.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/40"
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          mastered ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      />
                      <span
                        className={`flex-1 text-sm truncate ${
                          mastered ? "text-foreground" : "text-muted-foreground"
                        }`}
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {w.word}
                      </span>
                      {mastered && <Sparkles size={12} className="text-primary flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {total === 0 && !loading && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Brak słów w tej paczce. Wkrótce dodamy więcej!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
