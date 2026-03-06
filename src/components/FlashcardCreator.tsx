import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Layers, Trash2, BookOpen, Keyboard, ChevronRight, X, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { FlashcardSet } from "@/hooks/use-flashcard-sets";
import { getFlashcardIcon } from "@/lib/flashcard-icons";

interface FlashcardCreatorProps {
  onCreateSet: () => void;
  sets: FlashcardSet[];
  onDeleteSet: (id: string) => void;
  onStudySet: (set: FlashcardSet) => void;
  onTypingSet: (set: FlashcardSet) => void;
}

export function FlashcardCreator({ onCreateSet, sets, onDeleteSet, onStudySet, onTypingSet }: FlashcardCreatorProps) {
  const { user } = useAuth();
  const [expandedSet, setExpandedSet] = useState<string | null>(null);
  const [showAllSets, setShowAllSets] = useState(false);

  const sortedSets = [...sets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const recentSets = sortedSets.slice(0, 2);

  const allSetsOverlay = showAllSets
    ? createPortal(
        <AnimatePresence>
          <motion.div
            key="all-sets-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
          >
            <div className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Wszystkie zestawy ({sets.length})
              </h2>
              <button
                onClick={() => setShowAllSets(false)}
                className="p-2 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              <div className="w-full max-w-lg mx-auto space-y-2">
                {sortedSets.map((set) => (
                  <div key={set.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div
                      onClick={() => setExpandedSet(expandedSet === set.id ? null : set.id)}
                      className="flex items-center justify-between gap-3 p-4 hover:bg-secondary/60 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate flex items-center gap-1.5">
                          {(() => { const Icon = getFlashcardIcon(set.icon); return <Icon size={14} className="text-primary flex-shrink-0" />; })()}
                          {set.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {set.cards.length} {set.cards.length === 1 ? "fiszka" : set.cards.length < 5 ? "fiszki" : "fiszek"}
                          {set.description ? ` · ${set.description}` : ""}
                        </p>
                      </div>
                      <ChevronRight size={14} className={`text-muted-foreground transition-transform ${expandedSet === set.id ? "rotate-90" : ""}`} />
                    </div>
                    <AnimatePresence>
                      {expandedSet === set.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border overflow-hidden"
                        >
                          <div className="p-2 flex gap-2">
                            {set.cards.length >= 2 && (
                              <>
                                <button
                                  onClick={() => { setShowAllSets(false); onStudySet(set); }}
                                  className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <BookOpen size={14} />
                                  Ucz się
                                </button>
                                <button
                                  onClick={() => { setShowAllSets(false); onTypingSet(set); }}
                                  className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Keyboard size={14} />
                                  Uzupełnij
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteSet(set.id); }}
                              className="py-2 px-3 rounded-lg text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <>
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
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
              Twórz zestawy fiszek i ucz się efektywnie.
            </p>
          </div>

          <div className="px-6 pb-6 space-y-3">
            {!user ? (
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Zaloguj się, aby tworzyć własne fiszki.
                </p>
              </div>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onCreateSet}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium tracking-wide hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
                >
                  <Layers size={18} />
                  Nowy zestaw fiszek
                </motion.button>

                {sets.length > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAllSets(true)}
                    className="w-full py-3 rounded-xl border border-border text-sm font-medium tracking-wide hover:bg-secondary transition-colors cursor-pointer flex items-center justify-center gap-2 text-foreground"
                  >
                    <BookOpen size={16} />
                    Wszystkie zestawy ({sets.length})
                  </motion.button>
                )}

                {recentSets.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-muted-foreground" />
                      <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                        Ostatnio używane
                      </p>
                    </div>
                    <div className="space-y-2">
                      {recentSets.map((set) => (
                        <div key={set.id} className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
                          <div
                            onClick={() => setExpandedSet(expandedSet === set.id ? null : set.id)}
                            className="flex items-center justify-between gap-3 p-3 hover:bg-secondary/60 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate flex items-center gap-1.5">
                                {(() => { const Icon = getFlashcardIcon(set.icon); return <Icon size={14} className="text-primary flex-shrink-0" />; })()}
                                {set.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {set.cards.length} {set.cards.length === 1 ? "fiszka" : set.cards.length < 5 ? "fiszki" : "fiszek"}
                                {set.description ? ` · ${set.description}` : ""}
                              </p>
                            </div>
                            <ChevronRight size={14} className={`text-muted-foreground transition-transform ${expandedSet === set.id ? "rotate-90" : ""}`} />
                          </div>
                          <AnimatePresence>
                            {expandedSet === set.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-border overflow-hidden"
                              >
                                <div className="p-2 flex gap-2">
                                  {set.cards.length >= 2 && (
                                    <>
                                      <button
                                        onClick={() => onStudySet(set)}
                                        className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                      >
                                        <BookOpen size={14} />
                                         Ucz się
                                      </button>
                                      <button
                                        onClick={() => onTypingSet(set)}
                                        className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                      >
                                        <Keyboard size={14} />
                                        Uzupełnij
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteSet(set.id); }}
                                    className="py-2 px-3 rounded-lg text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
      {allSetsOverlay}
    </>
  );
}
