import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { categories, type WordCategory } from "@/data/words";

interface OnboardingDialogProps {
  open: boolean;
  name: string;
  onComplete: (selectedCategories: WordCategory[]) => void;
}

const selectableCategories = categories.filter(c => c.value !== "all" && c.value !== "własne");

export function OnboardingDialog({ open, name, onComplete }: OnboardingDialogProps) {
  const [selected, setSelected] = useState<WordCategory[]>([]);

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
              onClick={() => onComplete(selected)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              {selected.length > 0
                ? `Zacznij z ${selected.length} ${selected.length === 1 ? "kategorią" : "kategoriami"}`
                : "Pokaż wszystkie kategorie"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
