import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeftRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PolishWord } from "@/data/words";

interface SwapLevelDialogProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  packId: string;
  wordId: string;
  wordLabel: string;
  currentLevel: number | null;
  wordById: Map<string, PolishWord>;
  totalLevels?: number;
}

interface LevelRow {
  id: string;
  word_id: string;
  level: number;
  position: number;
}

export function SwapLevelDialog({
  open,
  onClose,
  onDone,
  packId,
  wordId,
  wordLabel,
  currentLevel,
  wordById,
  totalLevels = 5,
}: SwapLevelDialogProps) {
  const [targetLevel, setTargetLevel] = useState<number | null>(null);
  const [targetRows, setTargetRows] = useState<LevelRow[]>([]);
  const [sourceRow, setSourceRow] = useState<LevelRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!open) {
      setTargetLevel(null);
      setTargetRows([]);
      setSourceRow(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || targetLevel === null) return;
    (async () => {
      setLoading(true);
      const [{ data: tgt }, { data: src }] = await Promise.all([
        supabase
          .from("pack_level_words")
          .select("id, word_id, level, position")
          .eq("pack_id", packId)
          .eq("level", targetLevel)
          .order("position", { ascending: true }),
        currentLevel !== null
          ? supabase
              .from("pack_level_words")
              .select("id, word_id, level, position")
              .eq("pack_id", packId)
              .eq("word_id", wordId)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      setTargetRows(tgt ?? []);
      setSourceRow((src as LevelRow) ?? null);
      setLoading(false);
    })();
  }, [open, targetLevel, packId, wordId, currentLevel]);

  const handleSwap = async (target: LevelRow) => {
    if (working) return;
    setWorking(true);
    try {
      if (sourceRow) {
        // True swap: exchange word_ids between two rows
        const { error: e1 } = await supabase
          .from("pack_level_words")
          .update({ word_id: target.word_id })
          .eq("id", sourceRow.id);
        if (e1) throw e1;
        const { error: e2 } = await supabase
          .from("pack_level_words")
          .update({ word_id: wordId })
          .eq("id", target.id);
        if (e2) throw e2;
      } else {
        // Source not yet in any level — just replace target slot
        const { error } = await supabase
          .from("pack_level_words")
          .update({ word_id: wordId })
          .eq("id", target.id);
        if (error) throw error;
      }
      toast.success("Zamieniono");
      onDone();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Nie udało się zamienić");
    } finally {
      setWorking(false);
    }
  };

  const handleAssignEmpty = async () => {
    if (working || targetLevel === null) return;
    setWorking(true);
    try {
      if (sourceRow) {
        // Move source row to target level
        const nextPos = targetRows.length;
        const { error } = await supabase
          .from("pack_level_words")
          .update({ level: targetLevel, position: nextPos })
          .eq("id", sourceRow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pack_level_words").insert({
          pack_id: packId,
          level: targetLevel,
          word_id: wordId,
          position: targetRows.length,
        });
        if (error) throw error;
      }
      toast.success("Przeniesiono");
      onDone();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Nie udało się przenieść");
    } finally {
      setWorking(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border border-border shadow-lg overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {currentLevel !== null ? `Aktualnie poziom ${currentLevel}` : "Bez poziomu"}
                </p>
                <h2
                  className="text-base font-semibold truncate"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {wordLabel}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Wybierz docelowy poziom:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: totalLevels }, (_, i) => i + 1).map((lvl) => {
                    const active = targetLevel === lvl;
                    const isCurrent = currentLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        disabled={isCurrent}
                        onClick={() => setTargetLevel(lvl)}
                        className={`h-9 min-w-9 px-3 rounded-full text-xs font-medium transition-colors border ${
                          active
                            ? "bg-foreground text-background border-foreground"
                            : "border-foreground/15 text-foreground hover:bg-secondary/40"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        L{lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {targetLevel !== null && (
                <div>
                  {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Ładowanie…
                    </p>
                  ) : targetRows.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">
                        Poziom {targetLevel} jest pusty.
                      </p>
                      <button
                        onClick={handleAssignEmpty}
                        disabled={working}
                        className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 disabled:opacity-50"
                      >
                        Przenieś tutaj
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mb-2">
                        Wybierz słowo z poziomu {targetLevel}, z którym chcesz je zamienić:
                      </p>
                      <ul className="space-y-2">
                        {targetRows.map((r, i) => {
                          const w = wordById.get(r.word_id);
                          return (
                            <li key={r.id}>
                              <button
                                onClick={() => handleSwap(r)}
                                disabled={working}
                                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border border-foreground/10 hover:bg-secondary/40 transition-colors text-left disabled:opacity-50"
                              >
                                <span className="text-xs text-muted-foreground tabular-nums pt-0.5 w-5 text-right">
                                  {i + 1}.
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-sm text-foreground truncate"
                                    style={{ fontFamily: "var(--font-display)" }}
                                  >
                                    {w?.word ?? r.word_id}
                                  </p>
                                  {w && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                      {w.definition}
                                    </p>
                                  )}
                                </div>
                                <ArrowLeftRight
                                  size={14}
                                  className="text-muted-foreground mt-1 flex-shrink-0"
                                />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      {targetRows.length < 15 && (
                        <button
                          onClick={handleAssignEmpty}
                          disabled={working}
                          className="mt-3 w-full py-2 rounded-full border border-foreground/15 text-xs font-medium hover:bg-secondary/40 disabled:opacity-50"
                        >
                          {working ? (
                            <Loader2 size={14} className="animate-spin inline" />
                          ) : (
                            `Dodaj na wolne miejsce (${targetRows.length}/15)`
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
