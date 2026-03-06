import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles, Layers, Trash2, BookOpen, Keyboard, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { FlashcardSet } from "@/hooks/use-flashcard-sets";

interface FlashcardCreatorProps {
  onAddWord: () => void;
  onCreateSet: () => void;
  onImport: () => void;
  sets: FlashcardSet[];
  onDeleteSet: (id: string) => void;
  onStudySet: (set: FlashcardSet) => void;
  onTypingSet: (set: FlashcardSet) => void;
}

export function FlashcardCreator({ onAddWord, onCreateSet, onImport, sets, onDeleteSet, onStudySet, onTypingSet }: FlashcardCreatorProps) {
  const { user } = useAuth();
  const [expandedSet, setExpandedSet] = useState<string | null>(null);

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
            Dodaj własne słowa lub twórz zestawy fiszek.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-3">
          {!user ? (
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <p className="text-sm text-muted-foreground">
                Zaloguj się, aby tworzyć własne fiszki.
              </p>
            </div>
          ) : (
            <>
              {/* Create set button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onCreateSet}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium tracking-wide hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
              >
                <Layers size={18} />
                Nowy zestaw fiszek
              </motion.button>

              {/* Import */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onImport}
                className="w-full py-3 rounded-xl border border-border text-sm font-medium tracking-wide hover:bg-secondary transition-colors cursor-pointer flex items-center justify-center gap-2 text-foreground"
              >
                <Upload size={16} />
                Importuj fiszki
              </motion.button>

              {/* Quick add single word */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onAddWord}
                className="w-full py-3 rounded-xl border border-border text-sm font-medium tracking-wide hover:bg-secondary transition-colors cursor-pointer flex items-center justify-center gap-2 text-foreground"
              >
                <Plus size={16} />
                Dodaj pojedyncze słowo
              </motion.button>

              {/* Existing sets */}
              {sets.length > 0 && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                    Twoje zestawy ({sets.length})
                  </p>
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {sets.map((set) => (
                      <div key={set.id} className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
                        <div
                          onClick={() => setExpandedSet(expandedSet === set.id ? null : set.id)}
                          className="flex items-center justify-between gap-3 p-3 hover:bg-secondary/60 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{set.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {set.cards.length} {set.cards.length === 1 ? "fiszka" : set.cards.length < 5 ? "fiszki" : "fiszek"}
                              {set.description ? ` · ${set.description}` : ""}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteSet(set.id); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Expanded actions */}
                        {expandedSet === set.id && set.cards.length >= 2 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border"
                          >
                            <div className="p-2 flex gap-2">
                              <button
                                onClick={() => onStudySet(set)}
                                className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <BookOpen size={14} />
                                Przeglądaj
                              </button>
                              <button
                                onClick={() => onTypingSet(set)}
                                className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Keyboard size={14} />
                                Uzupełnij
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
