import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { estimateDifficulty } from "@/lib/difficulty-heuristic";

interface PackImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  packId: string;
  packCategory?: string; // category to assign in global_words (defaults to packId)
  level?: number; // jeśli podany, słowa lądują też w pack_level_words
}

interface ParsedWord {
  word: string;
  definition: string;
  example: string;
}

export function PackImportDialog({
  open,
  onClose,
  onImported,
  packId,
  packCategory,
  level,
}: PackImportDialogProps) {
  const { user } = useAuth();
  const [rawText, setRawText] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const parse = (): ParsedWord[] => {
    const lines = rawText.trim().split("\n").filter(Boolean);
    const out: ParsedWord[] = [];
    for (const line of lines) {
      const parts = line.includes("|")
        ? line.split("|").map((s) => s.trim())
        : line.split(" - ").map((s) => s.trim());
      if (parts.length >= 2) {
        out.push({ word: parts[0], definition: parts[1], example: parts[2] || "" });
      }
    }
    return out;
  };

  const handleImport = async () => {
    if (!user) {
      toast.error("Musisz być zalogowany");
      return;
    }
    const parsed = parse();
    if (parsed.length === 0) {
      toast.error("Nie znaleziono słów. Format: słowo | definicja | przykład");
      return;
    }

    setImporting(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    // Pobierz aktualne pozycje
    const { count: baseCount } = await supabase
      .from("pack_words")
      .select("id", { count: "exact", head: true })
      .eq("pack_id", packId);
    let basePos = baseCount ?? 0;

    let lvlPos = 0;
    if (level !== undefined) {
      const { count: lvlCount } = await supabase
        .from("pack_level_words")
        .select("id", { count: "exact", head: true })
        .eq("pack_id", packId)
        .eq("level", level);
      lvlPos = lvlCount ?? 0;
    }

    for (let i = 0; i < parsed.length; i++) {
      const w = parsed[i];
      try {
        const { data: inserted, error: insErr } = await supabase
          .from("global_words")
          .insert({
            word: w.word,
            definition: w.definition,
            example: w.example,
            part_of_speech: "",
            category: packCategory || packId,
            difficulty: estimateDifficulty(w.word),
            etymology: null,
            created_by: user.id,
          })
          .select("id")
          .single();
        if (insErr || !inserted) throw insErr;

        const wordId = `global-${inserted.id}`;

        const { error: pwErr } = await supabase.from("pack_words").insert({
          pack_id: packId,
          word_id: wordId,
          position: basePos++,
          created_by: user.id,
        });
        if (pwErr) throw pwErr;

        if (level !== undefined) {
          const { error: plErr } = await supabase.from("pack_level_words").insert({
            pack_id: packId,
            level,
            word_id: wordId,
            position: lvlPos++,
            created_by: user.id,
          });
          if (plErr) throw plErr;
        }

        success++;
      } catch (e) {
        console.error(e);
        failed++;
      }
      setProgress(Math.round(((i + 1) / parsed.length) * 100));
    }

    if (failed > 0) {
      toast.warning(`Zaimportowano ${success}, nie udało się ${failed}`);
    } else {
      toast.success(`Zaimportowano ${success} słów`);
    }
    setImporting(false);
    setRawText("");
    setProgress(0);
    onImported();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border border-border shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2
                className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {level !== undefined
                  ? `Import do poziomu ${level}`
                  : "Import do bazy paczki"}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <AlertCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Format:{" "}
                  <span className="font-mono text-primary">
                    słowo | definicja | przykład
                  </span>
                  <br />
                  Każde słowo w nowej linii. Przykład jest opcjonalny.
                  {level !== undefined
                    ? " Słowa zostaną dodane do bazy paczki i przypisane do tego poziomu."
                    : " Słowa zostaną dodane do globalnej bazy i bazy paczki."}
                </p>
              </div>
              <textarea
                placeholder={
                  "ontologia | dział filozofii o bycie | Ontologia bada naturę istnienia.\nepistemologia | teoria poznania | Epistemologia analizuje źródła wiedzy."
                }
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground text-center">
                Znalezione słowa:{" "}
                <span className="font-semibold text-foreground">{parse().length}</span>
              </p>
              {importing && (
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <button
                onClick={handleImport}
                disabled={!rawText.trim() || importing}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Importowanie… {progress}%
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Importuj
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
