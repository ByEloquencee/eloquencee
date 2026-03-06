import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw, X, BookOpen } from "lucide-react";
import type { FlashcardSet } from "@/hooks/use-flashcard-sets";

interface FlashcardStudyViewProps {
  set: FlashcardSet;
  onExit: () => void;
}

export function FlashcardStudyView({ set, onExit }: FlashcardStudyViewProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  const card = set.cards[index];
  const total = set.cards.length;

  const goNext = useCallback(() => {
    if (index < total - 1) {
      setDirection(1);
      setFlipped(false);
      setIndex((i) => i + 1);
    }
  }, [index, total]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setDirection(-1);
      setFlipped(false);
      setIndex((i) => i - 1);
    }
  }, [index]);

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setDirection(0);
  };

  if (!card) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <button
          onClick={onExit}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-semibold truncate max-w-[200px]" style={{ fontFamily: "var(--font-display)" }}>
            {set.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {index + 1} / {total}
          </p>
        </div>
        <button
          onClick={restart}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      {/* Progress bar */}
      <div className="w-full max-w-lg mx-auto px-4 pb-6">
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Card */}
      <main className="flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 100 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm"
          >
            <motion.button
              onClick={() => setFlipped((f) => !f)}
              className="w-full aspect-[3/4] max-h-[50vh] rounded-2xl border border-border bg-card shadow-sm p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md transition-shadow"
              whileTap={{ scale: 0.98 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={flipped ? "back" : "front"}
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-4"
                >
                  <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
                    {flipped ? "Definicja" : "Termin"}
                  </span>
                  <p
                    className="text-2xl md:text-3xl font-semibold leading-snug"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {flipped ? card.definition : card.word}
                  </p>
                  {!flipped && (
                    <span className="text-xs text-muted-foreground mt-2">
                      Stuknij, aby obrócić
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <div className="w-full max-w-lg mx-auto px-4 pb-8 flex items-center justify-center gap-4">
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="p-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer disabled:opacity-30"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen size={14} />
          <span>{total} fiszek</span>
        </div>
        <button
          onClick={goNext}
          disabled={index === total - 1}
          className="p-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer disabled:opacity-30"
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
