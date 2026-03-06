import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText } from "lucide-react";
import { toast } from "sonner";

interface FlashcardImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (
    title: string,
    description: string,
    cards: { word: string; definition: string }[]
  ) => Promise<void>;
}

export function FlashcardImportDialog({ open, onClose, onImport }: FlashcardImportDialogProps) {
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [termSep, setTermSep] = useState<"tab" | "semicolon" | "dash">("tab");
  const [rowSep, setRowSep] = useState<"newline" | "semicolon">("newline");
  const [submitting, setSubmitting] = useState(false);

  const separators: Record<string, { term: RegExp; row: RegExp }> = {
    "tab-newline": { term: /\t/, row: /\n/ },
    "semicolon-newline": { term: /;/, row: /\n/ },
    "dash-newline": { term: / - /, row: /\n/ },
    "tab-semicolon": { term: /\t/, row: /;/ },
    "semicolon-semicolon": { term: /;/, row: /;/ },
    "dash-semicolon": { term: / - /, row: /;/ },
  };

  const parseCards = () => {
    const key = `${termSep}-${rowSep}`;
    const sep = separators[key];
    if (!sep) return [];

    const rows = rawText.split(sep.row).filter((r) => r.trim());
    return rows
      .map((row) => {
        const parts = row.split(sep.term);
        if (parts.length < 2) return null;
        return { word: parts[0].trim(), definition: parts.slice(1).join(" ").trim() };
      })
      .filter((c): c is { word: string; definition: string } => !!c && !!c.word && !!c.definition);
  };

  const parsed = rawText.trim() ? parseCards() : [];

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Podaj tytuł zestawu");
      return;
    }
    if (parsed.length < 2) {
      toast.error("Potrzeba co najmniej 2 fiszek");
      return;
    }
    setSubmitting(true);
    try {
      await onImport(title.trim(), "", parsed);
      toast.success(`Zaimportowano ${parsed.length} fiszek!`);
      setTitle("");
      setRawText("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Nie udało się zaimportować");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const termSepOptions = [
    { value: "tab" as const, label: "Tabulator" },
    { value: "semicolon" as const, label: "Średnik (;)" },
    { value: "dash" as const, label: "Myślnik ( - )" },
  ];

  const rowSepOptions = [
    { value: "newline" as const, label: "Nowa linia" },
    { value: "semicolon" as const, label: "Średnik (;)" },
  ];

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
            <div className="flex items-center gap-2">
              <Upload size={18} className="text-primary" />
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Importuj fiszki
              </h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                Tytuł zestawu *
              </label>
              <input
                type="text"
                placeholder='np. "Angielski B2"'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Separator options */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
                  Między terminem a definicją
                </label>
                <div className="flex flex-wrap gap-1">
                  {termSepOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTermSep(opt.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        termSep === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
                  Między fiszkami
                </label>
                <div className="flex flex-wrap gap-1">
                  {rowSepOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRowSep(opt.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        rowSep === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Text area */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                Wklej dane
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={
                  termSep === "tab"
                    ? "słowo1\tdefinicja1\nsłowo2\tdefinicja2"
                    : termSep === "semicolon"
                    ? "słowo1;definicja1\nsłowo2;definicja2"
                    : "słowo1 - definicja1\nsłowo2 - definicja2"
                }
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Preview */}
            {parsed.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Podgląd: {parsed.length} fiszek
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {parsed.slice(0, 10).map((c, i) => (
                    <div key={i} className="flex gap-2 text-xs p-2 rounded-lg bg-secondary/50">
                      <span className="font-medium truncate flex-1">{c.word}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="truncate flex-1 text-muted-foreground">{c.definition}</span>
                    </div>
                  ))}
                  {parsed.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      ...i {parsed.length - 10} więcej
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || parsed.length < 2}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? "Importowanie..." : `Importuj ${parsed.length} fiszek`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
