import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { toast } from "sonner";
import { categories } from "@/data/words";
import type { PolishWord } from "@/data/words";

interface EditWordDialogProps {
  open: boolean;
  word: PolishWord | null;
  onClose: () => void;
  onSave: (wordId: string, updates: {
    word: string;
    part_of_speech: string;
    definition: string;
    example: string;
    etymology: string | null;
    category: string;
    difficulty?: string;
  }) => Promise<void>;
  showDifficulty?: boolean;
  title?: string;
}

const editableCategories = categories.filter(c => c.value !== "all" && c.value !== "własne");
const difficultyOptions = [
  { value: "beginner", label: "Łatwe" },
  { value: "intermediate", label: "Średnie" },
  { value: "advanced", label: "Trudne" },
];

export function EditWordDialog({ open, word, onClose, onSave, showDifficulty = false, title = "Edytuj słowo" }: EditWordDialogProps) {
  const [form, setForm] = useState({ word: "", partOfSpeech: "", definition: "", example: "", etymology: "", category: "własne", difficulty: "advanced" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (word) {
      setForm({
        word: word.word,
        partOfSpeech: word.partOfSpeech,
        definition: word.definition,
        example: word.example,
        etymology: word.etymology || "",
        category: word.category,
        difficulty: (word.difficulty as string) || "advanced",
      });
    }
  }, [word]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word || !form.word.trim() || !form.definition.trim()) return;
    setSubmitting(true);
    try {
      await onSave(word.id, {
        word: form.word.trim(),
        part_of_speech: form.partOfSpeech.trim(),
        definition: form.definition.trim(),
        example: form.example.trim(),
        etymology: form.etymology.trim() || null,
        category: form.category,
      });
      toast.success("Słowo zaktualizowane!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Nie udało się zaktualizować słowa");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !word) return null;

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <AnimatePresence>
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
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Edytuj słowo
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <input type="text" placeholder="Słowo *" value={form.word} onChange={(e) => setForm(f => ({ ...f, word: e.target.value }))} required maxLength={100} className={inputClass} />
            <input type="text" placeholder="Część mowy" value={form.partOfSpeech} onChange={(e) => setForm(f => ({ ...f, partOfSpeech: e.target.value }))} maxLength={50} className={inputClass} />
            <textarea placeholder="Definicja *" value={form.definition} onChange={(e) => setForm(f => ({ ...f, definition: e.target.value }))} required maxLength={500} rows={3} className={`${inputClass} resize-none`} />
            <input type="text" placeholder="Przykład użycia" value={form.example} onChange={(e) => setForm(f => ({ ...f, example: e.target.value }))} maxLength={300} className={inputClass} />
            <input type="text" placeholder="Etymologia (opcjonalnie)" value={form.etymology} onChange={(e) => setForm(f => ({ ...f, etymology: e.target.value }))} maxLength={200} className={inputClass} />
            <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
              <option value="własne">Własne</option>
              {editableCategories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <button
              type="submit"
              disabled={submitting || !form.word.trim() || !form.definition.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              {submitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
