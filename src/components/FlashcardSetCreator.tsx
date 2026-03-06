import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, GripVertical, Upload } from "lucide-react";
import { toast } from "sonner";

interface CardEntry {
  id: string;
  word: string;
  definition: string;
}

interface FlashcardSetCreatorProps {
  open: boolean;
  onClose: () => void;
  onCreated: (
    title: string,
    description: string,
    cards: { word: string; definition: string }[]
  ) => Promise<void>;
  onImport: () => void;
}

let nextId = 0;
const makeCard = (): CardEntry => ({ id: `card-${nextId++}`, word: "", definition: "" });

export function FlashcardSetCreator({ open, onClose, onCreated }: FlashcardSetCreatorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<CardEntry[]>([makeCard(), makeCard()]);
  const [submitting, setSubmitting] = useState(false);

  const updateCard = (id: string, field: "word" | "definition", value: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const removeCard = (id: string) => {
    if (cards.length <= 2) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const addCard = () => {
    setCards((prev) => [...prev, makeCard()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Podaj tytuł zestawu");
      return;
    }
    const validCards = cards.filter((c) => c.word.trim() && c.definition.trim());
    if (validCards.length < 2) {
      toast.error("Dodaj co najmniej 2 fiszki z wypełnionymi polami");
      return;
    }
    setSubmitting(true);
    try {
      await onCreated(
        title.trim(),
        description.trim(),
        validCards.map((c) => ({ word: c.word.trim(), definition: c.definition.trim() }))
      );
      toast.success("Zestaw fiszek utworzony!");
      setTitle("");
      setDescription("");
      setCards([makeCard(), makeCard()]);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Nie udało się utworzyć zestawu");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const filledCount = cards.filter((c) => c.word.trim() && c.definition.trim()).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 backdrop-blur-sm overflow-y-auto py-8 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Nowy zestaw fiszek
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filledCount} {filledCount === 1 ? "fiszka" : filledCount < 5 ? "fiszki" : "fiszek"}
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                Tytuł zestawu *
              </label>
              <input
                type="text"
                placeholder='np. "Słówka B2" lub "Biologia - rozdział 3"'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                Opis (opcjonalnie)
              </label>
              <input
                type="text"
                placeholder="Krótki opis zestawu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Separator */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fiszki</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Cards */}
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative rounded-xl border border-border bg-secondary/50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <GripVertical size={14} />
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                    {cards.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeCard(card.id)}
                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Termin / słowo"
                    value={card.word}
                    onChange={(e) => updateCard(card.id, "word", e.target.value)}
                    maxLength={100}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    placeholder="Definicja / tłumaczenie"
                    value={card.definition}
                    onChange={(e) => updateCard(card.id, "definition", e.target.value)}
                    maxLength={500}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </motion.div>
              ))}
            </div>

            {/* Add card button */}
            <button
              type="button"
              onClick={addCard}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Dodaj fiszkę
            </button>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !title.trim() || filledCount < 2}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Tworzenie..." : `Utwórz zestaw (${filledCount} fiszek)`}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
