import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Check, ArrowRight, Keyboard } from "lucide-react";
import type { FlashcardSet } from "@/hooks/use-flashcard-sets";

interface FlashcardTypingViewProps {
  set: FlashcardSet;
  onExit: () => void;
}

export function FlashcardTypingView({ set, onExit }: FlashcardTypingViewProps) {
  const shuffled = useMemo(
    () => [...set.cards].sort(() => Math.random() - 0.5),
    [set.cards]
  );
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"answering" | "correct" | "wrong">("answering");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const card = shuffled[index];
  const total = shuffled.length;

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

  const checkAnswer = useCallback(() => {
    if (!input.trim()) return;
    const isCorrect = normalize(input) === normalize(card.word);
    setStatus(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 1);
  }, [input, card]);

  const next = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setInput("");
    setStatus("answering");
  };

  const restart = () => {
    setIndex(0);
    setInput("");
    setStatus("answering");
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-sm p-8 text-center space-y-6">
          <div className="text-5xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {pct}%
          </div>
          <p className="text-sm text-muted-foreground">
            {score} z {total} poprawnych odpowiedzi
          </p>
          <div className="flex gap-3">
            <button
              onClick={restart}
              className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Jeszcze raz
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Zakończ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <button onClick={onExit} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
          <X size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-semibold truncate max-w-[200px]" style={{ fontFamily: "var(--font-display)" }}>
            {set.title}
          </h2>
          <p className="text-xs text-muted-foreground">{index + 1} / {total}</p>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-primary">
          <Check size={14} />
          {score}
        </div>
      </header>

      {/* Progress */}
      <div className="w-full max-w-lg mx-auto px-4 pb-6">
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Definition shown */}
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
              Definicja
            </span>
            <p className="mt-3 text-lg font-semibold leading-snug" style={{ fontFamily: "var(--font-display)" }}>
              {card.definition}
            </p>
          </div>

          {/* Input */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (status === "answering") checkAnswer();
                    else next();
                  }
                }}
                disabled={status !== "answering"}
                placeholder="Wpisz termin..."
                className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
                  status === "correct"
                    ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                    : status === "wrong"
                    ? "border-destructive bg-destructive/10"
                    : "border-border bg-secondary"
                }`}
              />
              <Keyboard size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>

            <AnimatePresence mode="wait">
              {status === "wrong" && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                >
                  <p className="text-xs text-muted-foreground">Poprawna odpowiedź:</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{card.word}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {status === "answering" ? (
              <button
                onClick={checkAnswer}
                disabled={!input.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Sprawdź
              </button>
            ) : (
              <button
                onClick={next}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
              >
                {index + 1 >= total ? "Zobacz wynik" : "Dalej"}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
