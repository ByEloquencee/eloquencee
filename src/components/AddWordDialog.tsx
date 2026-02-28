import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { categories, type WordCategory } from "@/data/words";

interface AddWordDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const editableCategories = categories.filter(c => c.value !== "all" && c.value !== "własne");

export function AddWordDialog({ open, onClose, onAdded }: AddWordDialogProps) {
  const { user } = useAuth();
  const [word, setWord] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [etymology, setEtymology] = useState("");
  const [category, setCategory] = useState<string>("własne");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Musisz być zalogowany, aby dodać własne słowo");
      return;
    }
    if (!word.trim() || !definition.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("custom_words").insert({
        user_id: user.id,
        word: word.trim(),
        part_of_speech: partOfSpeech.trim(),
        definition: definition.trim(),
        example: example.trim(),
        etymology: etymology.trim() || null,
        category,
      });
      if (error) throw error;
      toast.success("Dodano nowe słowo!");
      setWord(""); setPartOfSpeech(""); setDefinition(""); setExample(""); setEtymology(""); setCategory("własne");
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Nie udało się dodać słowa");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

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
              Dodaj własne słowo
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <input
              type="text"
              placeholder="Słowo *"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              required
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="text"
              placeholder="Część mowy (np. rzeczownik)"
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <textarea
              placeholder="Definicja *"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              required
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <input
              type="text"
              placeholder="Przykład użycia"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              maxLength={300}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="text"
              placeholder="Etymologia (opcjonalnie)"
              value={etymology}
              onChange={(e) => setEtymology(e.target.value)}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="własne">Własne</option>
              {editableCategories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <button
              type="submit"
              disabled={submitting || !word.trim() || !definition.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <Plus size={16} />
              {submitting ? "Dodawanie..." : "Dodaj słowo"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
