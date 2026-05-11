import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, RotateCcw, Trophy } from "lucide-react";
import { FLAGS, flagEmoji, type CountryFlag } from "@/data/flags";

interface FlagsLearningPanelProps {
  onClose: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FlagsLearningPanel({ onClose }: FlagsLearningPanelProps) {
  const deck = useMemo(() => shuffle(FLAGS), []);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const current = deck[index];

  const options = useMemo<CountryFlag[]>(() => {
    if (!current) return [];
    const others = FLAGS.filter((f) => f.code !== current.code);
    const distractors = shuffle(others).slice(0, 3);
    return shuffle([current, ...distractors]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const onPick = useCallback(
    (code: string) => {
      if (picked) return;
      setPicked(code);
      if (code === current.code) setScore((s) => s + 1);
    },
    [picked, current]
  );

  const next = useCallback(() => {
    if (index + 1 >= deck.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }, [index, deck.length]);

  // Auto-advance after a moment
  useEffect(() => {
    if (!picked) return;
    const t = setTimeout(next, 900);
    return () => clearTimeout(t);
  }, [picked, next]);

  const restart = () => {
    setIndex(0);
    setScore(0);
    setPicked(null);
    setFinished(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background flex flex-col"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pb-3 border-b border-border/40"
        style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
      >
        <button
          onClick={onClose}
          aria-label="Zamknij"
          className="h-9 w-9 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
        >
          <X size={18} />
        </button>
        <h2
          className="text-base font-semibold tracking-wide"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Flagi
        </h2>
        <div className="flex items-center gap-1.5 text-sm font-medium text-primary min-w-[64px] justify-end">
          <Check size={14} />
          {score}
          <span className="text-muted-foreground/70">/{deck.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            animate={{
              width: `${((finished ? deck.length : index + 1) / deck.length) * 100}%`,
            }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground text-center">
          {finished ? "Koniec gry" : `${index + 1} / ${deck.length}`}
        </p>
      </div>

      {finished ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm text-center space-y-6">
            <Trophy size={48} className="mx-auto text-primary" strokeWidth={1.5} />
            <div>
              <div
                className="text-5xl font-bold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {Math.round((score / deck.length) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {score} z {deck.length} poprawnych odpowiedzi
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={restart}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Jeszcze raz
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Zakończ
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-5 pt-6 pb-8 overflow-hidden">
          {/* Flag */}
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.code}
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -10 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="text-[140px] leading-none select-none"
                style={{
                  filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.35))",
                  fontFamily:
                    '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                }}
              >
                {flagEmoji(current.code)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5 max-w-md w-full mx-auto">
            {options.map((opt) => {
              const isPicked = picked === opt.code;
              const isCorrect = opt.code === current.code;
              const showResult = picked !== null;
              return (
                <button
                  key={opt.code}
                  onClick={() => onPick(opt.code)}
                  disabled={picked !== null}
                  className={`relative w-full px-4 py-3.5 rounded-xl border text-sm font-medium transition-all text-left ${
                    showResult && isCorrect
                      ? "border-green-500/70 bg-green-500/10 text-foreground"
                      : showResult && isPicked && !isCorrect
                      ? "border-destructive/70 bg-destructive/10 text-foreground"
                      : "border-border bg-secondary/60 hover:bg-secondary text-foreground"
                  }`}
                >
                  {opt.name}
                  {showResult && isCorrect && (
                    <Check
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
                    />
                  )}
                  {showResult && isPicked && !isCorrect && (
                    <X
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-destructive"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
