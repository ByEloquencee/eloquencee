import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { categories } from "@/data/words";
import { useAdminSuggestions } from "@/hooks/use-admin-suggestions";

type Mode = "global" | "pack";

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
  const [saving, setSaving] = useState(false);
  const { current, queueSize, targetSize, consume, isReady } = useAdminSuggestions();

  const handleSkip = () => {
    if (saving) return;
    consume();
  };

  const handleAccept = async () => {
    if (!current || !user) return;
    setSaving(true);
    try {
      const { data: inserted, error: insErr } = await (supabase
        .from("global_words" as any)
        .insert({
          word: current.word,
          part_of_speech: current.part_of_speech,
          definition: current.definition,
          example: current.example,
          etymology: current.etymology || null,
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
      consume();
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
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Tylko admin · {queueSize}/{targetSize} gotowych
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
            {!isReady ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 size={22} className="animate-spin" />
                <p className="text-xs">Przygotowywanie propozycji…</p>
                <p className="text-[10px] text-muted-foreground/70">
                  Działają w tle podczas korzystania z aplikacji
                </p>
              </div>
            ) : current ? (
              <div className="flex-1 space-y-2">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3
                    className="text-xl font-semibold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {current.word}
                  </h3>
                  <span className="text-[11px] text-muted-foreground italic">
                    {current.part_of_speech}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {current.definition}
                </p>
                {current.example && (
                  <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                    {current.example}
                  </p>
                )}
                {current.etymology && (
                  <p className="text-[11px] text-muted-foreground/80">
                    Etym.: {current.etymology}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border">
            <button
              onClick={handleSkip}
              disabled={saving || !current}
              aria-label="Odrzuć"
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
              disabled={saving || !current}
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
