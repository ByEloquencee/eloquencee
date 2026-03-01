import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface FlashcardCreatorProps {
  onAddWord: () => void;
}

export function FlashcardCreator({ onAddWord }: FlashcardCreatorProps) {
  const { user } = useAuth();

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles size={18} className="text-primary" />
            <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
              Twoje fiszki
            </span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Stwórz fiszkę
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Dodaj własne słowa i definicje, aby poszerzyć swój słownik.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          {!user ? (
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <p className="text-sm text-muted-foreground">
                Zaloguj się, aby tworzyć własne fiszki.
              </p>
            </div>
          ) : (
            <>
              {/* Quick add button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onAddWord}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium tracking-wide hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Dodaj nowe słowo
              </motion.button>

              {/* Tips */}
              <div className="p-4 rounded-xl border border-border space-y-3">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                  Wskazówki
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Dodawaj słowa, które spotykasz w codziennym życiu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Pisz przykłady użycia w zdaniach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Dodaj etymologię, jeśli znasz pochodzenie słowa</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
