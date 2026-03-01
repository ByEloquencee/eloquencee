import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Target } from "lucide-react";
import { categories, type WordCategory } from "@/data/words";

interface OnboardingDialogProps {
  open: boolean;
  name: string;
  onComplete: (selectedCategories: WordCategory[], dailyGoal: number) => void;
}

const selectableCategories = categories.filter(c => c.value !== "all" && c.value !== "własne");
const goalOptions = [3, 5, 10] as const;

export function OnboardingDialog({ open, name, onComplete }: OnboardingDialogProps) {
  const [selected, setSelected] = useState<WordCategory[]>([]);
  const [step, setStep] = useState<"categories" | "goal">("categories");
  const [dailyGoal, setDailyGoal] = useState<number>(5);

  const toggle = (cat: WordCategory) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
        >
          {step === "categories" ? (
            <>
              <div className="p-6 text-center space-y-2">
                <Sparkles size={32} className="mx-auto text-primary" />
                <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  Cześć{name ? `, ${name}` : ""}! 👋
                </h2>
                <p className="text-sm text-muted-foreground">
                  Wybierz kategorie, które Cię interesują. Będziemy częściej pokazywać słowa z tych kategorii.
                </p>
              </div>

              <div className="px-6 pb-4">
                <div className="flex flex-wrap gap-2">
                  {selectableCategories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => toggle(cat.value as WordCategory)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                        selected.includes(cat.value as WordCategory)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={() => setStep("goal")}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Dalej →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-6 text-center space-y-2">
                <Target size={32} className="mx-auto text-primary" />
                <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  Twój dzienny cel 🎯
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ile nowych słów chcesz przyswajać każdego dnia?
                </p>
              </div>

              <div className="px-6 pb-4">
                <div className="flex gap-3 justify-center">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setDailyGoal(goal)}
                      className={`flex-1 py-4 rounded-xl text-center transition-colors cursor-pointer border-2 ${
                        dailyGoal === goal
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                      }`}
                    >
                      <span className="text-2xl font-bold block">{goal}</span>
                      <span className="text-xs opacity-80">słów</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-2">
                <button
                  onClick={() => setStep("categories")}
                  className="px-4 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  ← Wróć
                </button>
                <button
                  onClick={() => onComplete(selected, dailyGoal)}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Zacznij naukę!
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
