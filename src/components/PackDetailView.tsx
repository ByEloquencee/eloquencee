import { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, BookOpen, Play, Sparkles, BrainCircuit } from "lucide-react";
import { FlashcardStudyView } from "@/components/FlashcardStudyView";
import { WordCard } from "@/components/WordCard";
import { QuizView } from "@/components/QuizView";
import { usePackWords } from "@/hooks/use-pack-words";
import { usePackProgress } from "@/hooks/use-pack-progress";
import { useFavorites } from "@/hooks/use-favorites";
import { useFolders } from "@/hooks/use-folders";
import { useProfile } from "@/hooks/use-profile";
import type { FlashcardSet } from "@/hooks/use-flashcard-sets";

interface PackDetailViewProps {
  packId: string;
  packLabel: string;
  onClose: () => void;
}

export function PackDetailView({ packId, packLabel, onClose }: PackDetailViewProps) {
  const { words, loading } = usePackWords(packId);
  const { masteredIds, masteredCount, markRevealed } = usePackProgress(packId);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { folders, toggleWordInFolder, isWordSaved, toggleSaved } = useFolders();
  const { profile } = useProfile();
  const [studyMode, setStudyMode] = useState<"session" | "browse" | "quiz" | null>(null);

  // Browse mode state (like main panel)
  const [browseIdx, setBrowseIdx] = useState(0);
  const [browseHistory, setBrowseHistory] = useState<number[]>([]);

  const total = words.length;
  const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;

  const sessionCards = useMemo(() => {
    if (total === 0) return [];
    const unmastered = words.filter((w) => !masteredIds.has(w.id));
    const pool = unmastered.length >= 10 ? unmastered : [...unmastered, ...words.filter((w) => masteredIds.has(w.id))];
    return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(10, pool.length));
  }, [words, masteredIds, total]);

  const studySet = useMemo<FlashcardSet | null>(() => {
    if (studyMode !== "session") return null;
    if (sessionCards.length === 0) return null;
    return {
      id: `pack-${packId}`,
      title: packLabel,
      description: "Sesja nauki",
      icon: "book-open",
      created_at: new Date().toISOString(),
      cards: sessionCards,
    };
  }, [studyMode, sessionCards, packId, packLabel]);

  const handleBrowseNext = useCallback(() => {
    if (total === 0) return;
    if (navigator.vibrate) navigator.vibrate(8);
    setBrowseHistory((prev) => [...prev, browseIdx]);
    setBrowseIdx((i) => (i + 1) % total);
  }, [browseIdx, total]);

  const handleBrowsePrev = useCallback(() => {
    if (browseHistory.length === 0) return;
    if (navigator.vibrate) navigator.vibrate(8);
    setBrowseHistory((prev) => {
      const next = [...prev];
      const last = next.pop()!;
      setBrowseIdx(last);
      return next;
    });
  }, [browseHistory]);

  // Session view — fully cover
  if (studySet) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <FlashcardStudyView
          set={studySet}
          onExit={() => setStudyMode(null)}
          onCardReveal={(wordId) => { void markRevealed(wordId); }}
        />
      </div>
    );
  }

  // Browse view — WordCard like main panel
  if (studyMode === "browse" && total > 0) {
    const current = words[browseIdx % total];
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="w-full max-w-lg mx-auto px-4 pt-[max(env(safe-area-inset-top),3rem)] pb-2 flex items-center gap-2">
          <button
            onClick={() => setStudyMode(null)}
            className="p-1 -ml-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Wstecz"
          >
            <ChevronLeft size={28} strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0 text-center pr-7">
            <p className="text-xs text-muted-foreground">
              {(browseIdx % total) + 1} / {total}
            </p>
          </div>
        </header>
        <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-4">
          {current && (
            <WordCard
              key={current.id}
              word={current}
              isFavorite={isFavorite(current.id)}
              onToggleFavorite={() => toggleFavorite(current.id)}
              isSaved={isWordSaved(current.id)}
              onToggleSaved={() => toggleSaved(current.id)}
              onNext={handleBrowseNext}
              onPrev={handleBrowsePrev}
              canGoBack={browseHistory.length > 0}
              folders={folders}
              onToggleFolder={(folderId) => toggleWordInFolder(folderId, current.id)}
              onReveal={() => { void markRevealed(current.id); }}
              difficultyLevel={profile?.difficulty_level || "advanced"}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
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
            {loading ? "Wczytywanie..." : `${total} słów`}
          </p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="w-full max-w-lg mx-auto space-y-8">
          {/* Hero stat */}
          <div className="relative pt-8 pb-10 flex flex-col items-center">
            {/* Decorative ring */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 46}
                  initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - pct / 100) }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              </svg>
              <div className="flex flex-col items-center">
                <span
                  className="text-5xl font-semibold leading-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {pct}%
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                  Przejrzane
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {masteredCount} z {total} słów
            </p>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setStudyMode("session")}
              disabled={total === 0}
              className="group relative w-full overflow-hidden rounded-3xl bg-primary text-primary-foreground p-6 flex items-center gap-4 hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {/* Decorative sparkles */}
              <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-primary-foreground/10 blur-2xl" />
              <div className="absolute right-4 top-3 opacity-40">
                <Sparkles size={14} />
              </div>
              <div className="absolute right-10 bottom-4 opacity-30">
                <Sparkles size={10} />
              </div>
              <div className="relative w-14 h-14 rounded-2xl bg-primary-foreground/15 flex items-center justify-center flex-shrink-0">
                <Play size={24} fill="currentColor" />
              </div>
              <div className="relative text-left flex-1">
                <p className="font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>
                  Rozpocznij sesję
                </p>
                <p className="text-xs opacity-80 mt-0.5">10 słów · priorytet nieznane</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => { setBrowseIdx(0); setBrowseHistory([]); setStudyMode("browse"); }}
              disabled={total === 0}
              className="group relative w-full overflow-hidden rounded-3xl bg-secondary text-secondary-foreground p-6 flex items-center gap-4 hover:bg-secondary/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-foreground/5 blur-2xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center flex-shrink-0">
                <BookOpen size={22} />
              </div>
              <div className="relative text-left flex-1">
                <p className="font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>
                  Przeglądaj wszystkie
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {total} słów do odkrycia
                </p>
              </div>
            </motion.button>
          </div>

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
