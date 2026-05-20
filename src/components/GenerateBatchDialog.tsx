import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const QUICK_PROMPTS = [
  "Poetyckie wyzwiska",
  "Dark academia",
  "Melancholijne archaizmy",
  "Egzystencjalistyczne",
  "Barokowe komplementy",
  "Wulgaryzmy literackie",
  "Średniowieczne",
  "Filozoficzne pojęcia",
];

const CATEGORIES = [
  { value: "ogólne", label: "Ogólne" },
  { value: "literackie", label: "Literackie" },
  { value: "naukowe", label: "Naukowe" },
  { value: "filozoficzne", label: "Filozoficzne" },
  { value: "psychologiczne", label: "Psychologiczne" },
  { value: "techniczne", label: "Techniczne" },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Początkujący" },
  { value: "intermediate", label: "Średni" },
  { value: "advanced", label: "Zaawansowany" },
];

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring";

interface Props {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

export function GenerateBatchDialog({ open, onClose, onDone }: Props) {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(10);
  const [category, setCategory] = useState("ogólne");
  const [difficulty, setDifficulty] = useState("advanced");
  const [tagsRaw, setTagsRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setSubmitting(true);
    const toastId = toast.loading(`Generuję ${count} słów dla: "${prompt}"...`);
    try {
      const tags = tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const { data, error } = await supabase.functions.invoke("generate-pending-batch", {
        body: { prompt: prompt.trim(), count, category, difficulty, tags },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(
        `Dodano ${(data as any).inserted}/${(data as any).total} do kolejki${
          (data as any).skipped ? ` (pominięto ${(data as any).skipped})` : ""
        }`,
        { id: toastId },
      );
      onDone();
      setPrompt("");
      setTagsRaw("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Nie udało się wygenerować partii", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                <Sparkles size={18} className="text-primary" />
                Generuj partię
              </h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Temat / prompt</label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="np. poetyckie wyzwiska"
                  className={inputClass}
                  required
                  maxLength={200}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setPrompt(q)}
                      className="text-[10px] px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Liczba słów: <span className="text-foreground font-medium">{count}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={25}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Kategoria</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Trudność</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputClass}>
                    {DIFFICULTIES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Tagi stylistyczne (oddziel przecinkami)</label>
                <input
                  type="text"
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  placeholder="poetyckie, archaiczne, ironiczne"
                  className={inputClass}
                  maxLength={200}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !prompt.trim()}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generuję...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Wygeneruj {count} słów
                  </>
                )}
              </button>
              <p className="text-[10px] text-muted-foreground text-center">
                Słowa trafią do kolejki moderacji. Nic nie zostanie opublikowane automatycznie.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
