import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, Trophy, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import type { PolishWord } from "@/data/words";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QuizViewProps {
  words: PolishWord[];
  allWords: PolishWord[];
  onExit: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestion(word: PolishWord, pool: PolishWord[]) {
  const others = pool.filter((w) => w.id !== word.id);
  const distractors = shuffle(others).slice(0, 3);
  const options = shuffle([word, ...distractors]);
  return { definition: word.definition, correctId: word.id, options };
}

export function QuizView({ words, allWords, onExit }: QuizViewProps) {
  const questions = useMemo(() => {
    const pool = allWords.length >= 4 ? allWords : words;
    return shuffle(words).map((w) => generateQuestion(w, pool.length >= 4 ? pool : words));
  }, [words, allWords]);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [inspectWord, setInspectWord] = useState<PolishWord | null>(null);
  const [maxReached, setMaxReached] = useState(0);

  const question = questions[current];
  const selected = answers[current] ?? null;

  const handleSelect = useCallback(
    (id: string) => {
      if (answers[current] !== undefined) return;
      setAnswers((prev) => ({ ...prev, [current]: id }));
      const correct = id === question.correctId;
      if (correct) setScore((s) => s + 1);
      setTimeout(() => {
        if (current + 1 >= questions.length) {
          setFinished(true);
        } else {
          const next = current + 1;
          setCurrent(next);
          setMaxReached((m) => Math.max(m, next));
        }
      }, 1200);
    },
    [answers, current, question, questions.length]
  );

  const canGoBack = current > 0;
  const canGoForward = current < maxReached;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4 max-w-sm"
        >
          <Trophy size={56} className="mx-auto text-primary" />
          <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Wynik: {score}/{questions.length}
          </h2>
          <p className="text-muted-foreground text-sm">{pct}% poprawnych odpowiedzi</p>
          <div className="flex gap-3 justify-center pt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onExit}
              className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              Wróć
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCurrent(0);
                setAnswers({});
                setScore(0);
                setMaxReached(0);
                setFinished(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              Jeszcze raz
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onExit}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </motion.button>
          {canGoBack && (
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrent((c) => c - 1)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Poprzednie pytanie"
            >
              <ChevronLeft size={20} />
            </motion.button>
          )}
          {canGoForward && (
            <motion.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrent((c) => c + 1)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Następne pytanie"
            >
              <ChevronRight size={20} />
            </motion.button>
          )}
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {current + 1} / {questions.length}
        </span>
        <span className="text-sm font-semibold text-primary">{score} pkt</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-6"
          >
            <div className="p-5 rounded-2xl bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Definicja:</p>
              <p className="text-base font-medium text-foreground leading-relaxed">
                {question.definition}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {question.options.map((opt) => {
                const isSelected = selected === opt.id;
                const isCorrect = opt.id === question.correctId;
                const showResult = selected !== null;

                let classes =
                  "w-full p-4 rounded-xl text-left text-sm font-medium transition-all border ";
                if (showResult && isCorrect) {
                  classes += "bg-green-500/15 border-green-500/50 text-green-700 dark:text-green-400";
                } else if (showResult && isSelected && !isCorrect) {
                  classes += "bg-red-500/15 border-red-500/50 text-red-700 dark:text-red-400";
                } else if (showResult) {
                  classes += "bg-secondary border-border text-muted-foreground opacity-60";
                } else {
                  classes += "bg-secondary border-border text-foreground hover:bg-secondary/80 cursor-pointer";
                }

                return (
                  <motion.button
                    key={opt.id}
                    whileTap={!selected ? { scale: 0.97 } : {}}
                    onClick={() => handleSelect(opt.id)}
                    disabled={!!selected}
                    className={classes}
                  >
                    <span className="flex items-center justify-between">
                      <span>{opt.word}</span>
                      <span className="flex items-center gap-1.5">
                        {showResult && isCorrect && <Check size={16} />}
                        {showResult && isSelected && !isCorrect && <X size={16} />}
                        {showResult && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectWord(opt);
                            }}
                            className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Sprawdź znaczenie"
                          >
                            <BookOpen size={14} />
                          </motion.button>
                        )}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <Dialog open={!!inspectWord} onOpenChange={(o) => !o && setInspectWord(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
              {inspectWord?.word}
            </DialogTitle>
          </DialogHeader>
          {inspectWord && (
            <div className="space-y-3">
              <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                {inspectWord.partOfSpeech}
              </span>
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-sm leading-relaxed text-foreground">{inspectWord.definition}</p>
              </div>
              <div className="p-4 rounded-xl border border-border">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">Przykład</p>
                <p className="text-sm leading-relaxed text-muted-foreground italic">„{inspectWord.example}"</p>
              </div>
              {inspectWord.etymology && (
                <p className="text-xs text-muted-foreground italic">{inspectWord.etymology}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
