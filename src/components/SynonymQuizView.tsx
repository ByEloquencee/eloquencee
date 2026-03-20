import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, Trophy, Loader2, RotateCcw, Sparkles, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PolishWord } from "@/data/words";
import { toast } from "sonner";

interface SynonymQuestion {
  question_word: string;
  question_definition: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface SynonymQuizViewProps {
  words: PolishWord[];
  onExit: () => void;
  onComplete?: (correctCount: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ResultsScreen({ score, total, onExit, onRestart }: { score: number; total: number; onExit: () => void; onRestart: () => void }) {
  const pct = Math.round((score / total) * 100);
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4 max-w-sm">
        <Trophy size={56} className="mx-auto text-primary" />
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Wynik: {score % 1 === 0 ? score : score.toFixed(1)}/{total}</h2>
        <p className="text-muted-foreground text-sm">{pct}% poprawnych odpowiedzi</p>
        <div className="flex gap-3 justify-center pt-4">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onExit} className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium cursor-pointer hover:bg-secondary/80 transition-colors">Wróć</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onRestart} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">Jeszcze raz</motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export function SynonymQuizView({ words, onExit, onComplete }: SynonymQuizViewProps) {
  const [questions, setQuestions] = useState<SynonymQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(2);
  const [hintUsedOnCurrent, setHintUsedOnCurrent] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(false);
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setHintsLeft(2);
    setHintUsedOnCurrent(false);

    try {
      const wordPool = shuffle(words).slice(0, 30).map((w) => ({
        word: w.word,
        definition: w.definition,
      }));

      const { data, error: fnError } = await supabase.functions.invoke("generate-synonym-quiz", {
        body: { words: wordPool },
      });

      if (fnError) throw fnError;
      if (data?.questions?.length) {
        setQuestions(data.questions);
      } else {
        throw new Error("No questions");
      }
    } catch {
      setError(true);
      toast.error("Nie udało się wygenerować quizu synonimów");
    } finally {
      setLoading(false);
    }
  }, [words]);

  // Auto-fetch on mount
  useState(() => { fetchQuestions(); });

  const question = questions[current];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === question.correct) setScore((s) => s + (hintUsedOnCurrent ? 0.5 : 1));
  };

  const handleAdvance = () => {
    if (selected === null) return;
    if (current + 1 >= questions.length) {
      setFinished(true);
      onComplete?.(score);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setHintUsedOnCurrent(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-3">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generowanie quizu synonimów...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-sm text-muted-foreground">Nie udało się załadować quizu.</p>
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onExit} className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium cursor-pointer">Wróć</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={fetchQuestions} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium cursor-pointer flex items-center gap-2">
            <RotateCcw size={16} /> Spróbuj ponownie
          </motion.button>
        </div>
      </div>
    );
  }

  if (finished) {
    return <ResultsScreen score={score} total={questions.length} onExit={onExit} onRestart={fetchQuestions} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onExit} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Sparkles size={14} className="text-primary" />
          <span>Synonimy</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{current + 1}/{questions.length}</span>
          <span className="text-sm font-semibold text-primary">{score} pkt</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12 max-w-lg mx-auto w-full relative">
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full relative z-10 space-y-6">
            {/* Question word */}
            <div className="p-5 rounded-2xl bg-secondary/50 border border-border text-center relative">
              {selected === null && !hintUsedOnCurrent && hintsLeft > 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setHintsLeft((h) => h - 1); setHintUsedOnCurrent(true); }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                  title={`Pokaż definicję (${hintsLeft} pozostało) · 0.5 pkt`}
                >
                  <Lightbulb size={15} />
                </motion.button>
              )}
              <p className="text-xs text-muted-foreground mb-2 font-medium">Znajdź synonim słowa:</p>
              <p className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {question.question_word}
              </p>
              <AnimatePresence>
                {(selected !== null || hintUsedOnCurrent) && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-xs text-muted-foreground mt-2 leading-relaxed overflow-hidden">
                    {question.question_definition}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-2.5">
              {question.options.map((opt, idx) => {
                const isSelected = selected === idx;
                const isCorrect = idx === question.correct;
                const showResult = selected !== null;

                let classes = "w-full p-4 rounded-xl text-left text-sm font-medium transition-all border ";
                if (showResult && isCorrect) classes += "bg-green-500/15 border-green-500/50 text-green-700 dark:text-green-400";
                else if (showResult && isSelected && !isCorrect) classes += "bg-red-500/15 border-red-500/50 text-red-700 dark:text-red-400";
                else if (showResult) classes += "bg-secondary border-border text-muted-foreground opacity-60";
                else classes += "bg-secondary border-border text-foreground hover:bg-secondary/80 cursor-pointer";

                return (
                  <motion.button
                    key={idx}
                    whileTap={selected === null ? { scale: 0.98 } : {}}
                    onClick={() => handleSelect(idx)}
                    disabled={selected !== null}
                    className={`${classes} disabled:cursor-default`}
                  >
                    <span className="flex items-center justify-between">
                      <span>{opt}</span>
                      {showResult && isCorrect && <Check size={16} />}
                      {showResult && isSelected && !isCorrect && <X size={16} />}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {selected !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                >
                  <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
                    selected === question.correct
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {selected === question.correct ? (
                      <Check size={16} className="flex-shrink-0 mt-0.5" />
                    ) : (
                      <X size={16} className="flex-shrink-0 mt-0.5" />
                    )}
                    <p className="leading-relaxed">{question.explanation}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {selected !== null && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs text-muted-foreground cursor-pointer"
                onClick={handleAdvance}
              >
                Kliknij aby przejść dalej
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>

        {selected !== null && (
          <div className="absolute inset-0 cursor-pointer" style={{ zIndex: 0 }} onClick={handleAdvance} />
        )}
      </main>
    </div>
  );
}
