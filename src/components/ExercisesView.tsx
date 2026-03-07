import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle, XCircle, RotateCcw, BookOpen, Type, SpellCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DifficultyLevel } from "@/hooks/use-profile";
import { toast } from "sonner";

interface ExercisesViewProps {
  difficulty: DifficultyLevel;
  onExit: () => void;
}

type ExerciseType = "grammar" | "punctuation" | "spelling";

interface Exercise {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const exerciseTypes: { value: ExerciseType; label: string; icon: typeof BookOpen }[] = [
  { value: "grammar", label: "Gramatyka", icon: BookOpen },
  { value: "punctuation", label: "Interpunkcja", icon: Type },
  { value: "spelling", label: "Ortografia", icon: SpellCheck },
];

export function ExercisesView({ difficulty, onExit }: ExercisesViewProps) {
  const [activeType, setActiveType] = useState<ExerciseType | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const fetchExercise = useCallback(async (type: ExerciseType) => {
    setLoading(true);
    setSelected(null);
    setExercise(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-exercise", {
        body: { type, difficulty },
      });
      if (error) throw error;
      if (data?.exercise) {
        setExercise(data.exercise);
      } else {
        toast.error("Nie udało się wygenerować ćwiczenia");
      }
    } catch {
      toast.error("Błąd podczas generowania ćwiczenia");
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  const handleSelectType = (type: ExerciseType) => {
    setActiveType(type);
    setScore({ correct: 0, total: 0 });
    fetchExercise(type);
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null || !exercise) return;
    setSelected(idx);
    setScore((prev) => ({
      correct: prev.correct + (idx === exercise.correct ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    if (activeType) fetchExercise(activeType);
  };

  // Type selection screen
  if (!activeType) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 flex items-center gap-3">
          <button onClick={onExit} className="p-2 rounded-xl hover:bg-secondary transition-colors cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Ćwiczenia
          </h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <p className="text-sm text-muted-foreground text-center mb-2">
            Wybierz typ ćwiczenia
          </p>
          {exerciseTypes.map((t) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.value}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelectType(t.value)}
                className="w-full max-w-xs flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="p-3 rounded-xl bg-primary/10">
                  <Icon size={22} className="text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold">{t.label}</span>
                  <p className="text-xs text-muted-foreground">
                    {t.value === "grammar" && "Odmiany, czasy, przypadki"}
                    {t.value === "punctuation" && "Przecinki, kropki, myślniki"}
                    {t.value === "spelling" && "ó/u, rz/ż, ch/h"}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </main>
      </div>
    );
  }

  // Exercise view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveType(null)}
            className="p-2 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {exerciseTypes.find((t) => t.value === activeType)?.label}
          </h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {score.correct}/{score.total}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 size={32} className="animate-spin" />
              <span className="text-sm">Generowanie ćwiczenia...</span>
            </div>
          ) : exercise ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border p-6 space-y-5"
            >
              <p className="text-base font-medium leading-relaxed">{exercise.question}</p>

              <div className="space-y-2">
                {exercise.options.map((opt, idx) => {
                  let style = "bg-secondary text-secondary-foreground hover:bg-secondary/80";
                  if (selected !== null) {
                    if (idx === exercise.correct) {
                      style = "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30";
                    } else if (idx === selected && idx !== exercise.correct) {
                      style = "bg-destructive/15 text-destructive border-destructive/30";
                    } else {
                      style = "bg-secondary/50 text-muted-foreground";
                    }
                  }
                  return (
                    <motion.button
                      key={idx}
                      whileTap={selected === null ? { scale: 0.98 } : {}}
                      onClick={() => handleAnswer(idx)}
                      disabled={selected !== null}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer border ${style} disabled:cursor-default`}
                    >
                      <span className="mr-2 text-muted-foreground">{String.fromCharCode(65 + idx)}.</span>
                      {opt}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {selected !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
                      selected === exercise.correct
                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {selected === exercise.correct ? (
                        <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                      )}
                      <p className="leading-relaxed">{exercise.explanation}</p>
                    </div>

                    <button
                      onClick={handleNext}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <RotateCcw size={16} />
                      Następne ćwiczenie
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
