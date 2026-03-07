import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Lightbulb, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { categories } from "@/data/words";
import { toast } from "sonner";

const editableCategories = categories.filter(c => c.value !== "all" && c.value !== "własne");
const inputClass = "w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function SuggestWordPanel() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    word: "", definition: "", example: "", part_of_speech: "", etymology: "", category: "ogólne",
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.word.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase.from("word_suggestions" as any).insert({
        word: form.word.trim(),
        definition: form.definition.trim(),
        example: form.example.trim(),
        part_of_speech: form.part_of_speech.trim(),
        etymology: form.etymology.trim() || null,
        category: form.category,
        suggested_by: user.id,
      }) as any);
      if (error) throw error;
      toast.success("Propozycja wysłana!");
      setForm({ word: "", definition: "", example: "", part_of_speech: "", etymology: "", category: "ogólne" });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) {
      toast.error(err.message || "Nie udało się wysłać propozycji");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center h-full px-4">
        <Lightbulb size={48} className="text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground text-center">
          Zaloguj się, aby zaproponować słowo twórcom aplikacji.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto h-full flex flex-col overflow-hidden">
      <div className="px-1 pb-3 space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-primary" />
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Zaproponuj słowo
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Znasz ciekawe słowo? Podziel się nim z twórcami!
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 gap-3"
          >
            <CheckCircle size={48} className="text-primary" />
            <p className="text-sm font-medium">Dziękujemy za propozycję!</p>
            <p className="text-xs text-muted-foreground">Moderatorzy ją wkrótce przejrzą.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" placeholder="Słowo *" value={form.word} onChange={(e) => setForm(f => ({ ...f, word: e.target.value }))} required maxLength={100} className={inputClass} />
            <input type="text" placeholder="Część mowy (np. rzeczownik)" value={form.part_of_speech} onChange={(e) => setForm(f => ({ ...f, part_of_speech: e.target.value }))} maxLength={50} className={inputClass} />
            <textarea placeholder="Definicja (opcjonalnie)" value={form.definition} onChange={(e) => setForm(f => ({ ...f, definition: e.target.value }))} maxLength={500} rows={3} className={`${inputClass} resize-none`} />
            <input type="text" placeholder="Przykład użycia (opcjonalnie)" value={form.example} onChange={(e) => setForm(f => ({ ...f, example: e.target.value }))} maxLength={300} className={inputClass} />
            <input type="text" placeholder="Etymologia (opcjonalnie)" value={form.etymology} onChange={(e) => setForm(f => ({ ...f, etymology: e.target.value }))} maxLength={200} className={inputClass} />
            <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
              {editableCategories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting || !form.word.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <Send size={16} />
              {submitting ? "Wysyłanie..." : "Wyślij propozycję"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
