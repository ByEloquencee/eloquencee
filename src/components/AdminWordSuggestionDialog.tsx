import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { categories } from "@/data/words";

type Mode = "global" | "pack";

interface Suggestion {
  word: string;
  part_of_speech: string;
  definition: string;
  example: string;
  etymology: string;
}

interface Props {
  open: boolean;
  mode: Mode;
  onClose: () => void;
}

const packOptions = categories.filter(
  (c) => c.value !== "all" && c.value !== "własne" && c.value !== "ciekawi_ludzie",
);

export function AdminWordSuggestionDialog({ open, mode, onClose }: Props) {
  const { user } = useAuth();
  const [category, setCategory] = useState<string>("ogólne");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    setSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-word", {
        body: { category, difficulty: "advanced" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuggestion(data as Suggestion);
    } catch (e: any) {
      toast.error(e.message || "Błąd generowania");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (open) fetchNext();
    else setSuggestion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  const handleAccept = async () => {
    if (!suggestion || !user) return;
    setSaving(true);
    try {
      const { data: inserted, error: insErr } = await (supabase
        .from("global_words" as any)
        .insert({
          word: suggestion.word,
          part_of_speech: suggestion.part_of_speech,
          definition: suggestion.definition,
          example: suggestion.example,
          etymology: suggestion.etymology || null,
          category,
          difficulty: "advanced",
          created_by: user.id,
        })
        .select("id")
        .single() as any);
      if (insErr) throw insErr;

      if (mode === "pack") {
        const { count } = await (supabase
          .from("pack_words" as any)
          .select("id", { count: "exact", head: true })
          .eq("pack_id", category) as any);
        const { error: pwErr } = await (supabase.from("pack_words" as any).insert({
          pack_id: category,
          word_id: `global-${inserted.id}`,
          position: count ?? 0,
          created_by: user.id,
        }) as any);
        if (pwErr) throw pwErr;
        toast.success(`Dodano do paczki "${category}"`);
      } else {
        toast.success("Dodano do bazy globalnej");
      }
      fetchNext();
    } catch (e: any) {
      toast.error(e.message || "Nie udało się dodać");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Tylko admin
              </p>
              <h2 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {mode === "pack" ? "Słowo do paczki" : "Słowo globalne"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-5 pt-4">
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              {mode === "pack" ? "Paczka" : "Kategoria"}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {packOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="px-5 py-4 min-h-[200px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 size={22} className="animate-spin" />
                <p className="text-xs">Generowanie propozycji…</p>
              </div>
            ) : suggestion ? (
              <div className="flex-1 space-y-2">
                <div className="flex items-baseline gap-2">
                  <h3
                    className="text-xl font-semibold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {suggestion.word}
                  </h3>
                  <span className="text-[11px] text-muted-foreground italic">
                    {suggestion.part_of_speech}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {suggestion.definition}
                </p>
                {suggestion.example && (
                  <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                    {suggestion.example}
                  </p>
                )}
                {suggestion.etymology && (
                  <p className="text-[11px] text-muted-foreground/80">
                    Etym.: {suggestion.etymology}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <button
                  onClick={fetchNext}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw size={14} /> Spróbuj ponownie
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border">
            <button
              onClick={fetchNext}
              disabled={loading || saving}
              aria-label="Odrzuć i pokaż następne"
              className="h-12 w-12 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40"
            >
              <Minus size={20} />
            </button>
            <p className="text-[11px] text-muted-foreground text-center flex-1">
              {mode === "pack"
                ? "Dodaje do globalnych i do paczki"
                : "Dodaje do bazy globalnej"}
            </p>
            <button
              onClick={handleAccept}
              disabled={loading || saving || !suggestion}
              aria-label="Akceptuj i dodaj"
              className="h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
