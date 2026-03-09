import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { categories, type WordCategory } from "@/data/words";
import { useGlobalWords } from "@/hooks/use-global-words";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const editableCategories = categories.filter(c => c.value !== "all" && c.value !== "własne");
const difficultyOptions = [
  { value: "beginner", label: "Łatwe" },
  { value: "intermediate", label: "Średnie" },
  { value: "advanced", label: "Trudne" },
];
const partOfSpeechOptions = [
  { value: "rzeczownik", label: "Rzeczownik" },
  { value: "przymiotnik", label: "Przymiotnik" },
  { value: "czasownik", label: "Czasownik" },
];

const inputClass = "w-full px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring";

interface ParsedWord {
  word: string;
  definition: string;
  example: string;
}

interface WordWithMeta extends ParsedWord {
  part_of_speech: string;
  category: string;
  difficulty: string;
}

interface ImportWordsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportWordsDialog({ open, onClose }: ImportWordsDialogProps) {
  const { user } = useAuth();
  const { addWord } = useGlobalWords();
  const [step, setStep] = useState<"paste" | "metadata">("paste");
  const [rawText, setRawText] = useState("");
  const [wordsWithMeta, setWordsWithMeta] = useState<WordWithMeta[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const parseText = () => {
    const lines = rawText.trim().split("\n").filter(Boolean);
    const words: ParsedWord[] = [];
    for (const line of lines) {
      const parts = line.includes("|")
        ? line.split("|").map(s => s.trim())
        : line.split(" - ").map(s => s.trim());
      if (parts.length >= 2) {
        words.push({ word: parts[0], definition: parts[1], example: parts[2] || "" });
      }
    }
    return words;
  };

  const handleNext = () => {
    const words = parseText();
    if (words.length === 0) {
      toast.error("Nie znaleziono żadnych słów. Użyj formatu: słowo | definicja | przykład");
      return;
    }
    setWordsWithMeta(words.map(w => ({
      ...w,
      part_of_speech: "rzeczownik",
      category: "ogólne",
      difficulty: "advanced",
    })));
    setStep("metadata");
  };

  const updateWordMeta = (index: number, field: keyof WordWithMeta, value: string) => {
    setWordsWithMeta(prev => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
  };

  const applyToAll = (field: "part_of_speech" | "category" | "difficulty", value: string) => {
    setWordsWithMeta(prev => prev.map(w => ({ ...w, [field]: value })));
  };

  const handleImport = async () => {
    if (!user) return;
    setImporting(true);
    setImportProgress(0);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < wordsWithMeta.length; i++) {
      const w = wordsWithMeta[i];
      try {
        await addWord({
          word: w.word,
          definition: w.definition,
          example: w.example,
          part_of_speech: w.part_of_speech,
          category: w.category,
          difficulty: w.difficulty,
          etymology: null,
          created_by: user.id,
        } as any);
        success++;
      } catch {
        failed++;
      }
      setImportProgress(Math.round(((i + 1) / wordsWithMeta.length) * 100));
    }

    if (failed > 0) {
      toast.warning(`Zaimportowano ${success} słów, ${failed} nie udało się dodać`);
    } else {
      toast.success(`Zaimportowano ${success} słów!`);
    }
    handleClose();
  };

  const handleClose = () => {
    setStep("paste");
    setRawText("");
    setWordsWithMeta([]);
    setImporting(false);
    setImportProgress(0);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {step === "paste" ? "Importuj słowa" : "Uzupełnij dane"}
              </h2>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {step === "paste" ? (
              <div className="p-5 space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <AlertCircle size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Wklej listę słów w formacie:<br />
                    <span className="font-mono text-primary">słowo | definicja | przykład</span><br />
                    Każde słowo w nowej linii. Przykład jest opcjonalny.
                  </p>
                </div>
                <textarea
                  placeholder={"efemeryczny | krótkotrwały, ulotny | Efemeryczna piękność kwiatu wiśni.\nlakoniczny | zwięzły, treściwy | Jego lakoniczna odpowiedź zaskoczyła wszystkich."}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Znalezione słowa: <span className="font-semibold text-foreground">{parseText().length}</span>
                </p>
                <button
                  onClick={handleNext}
                  disabled={!rawText.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  Dalej
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col min-h-0 flex-1">
                <div className="px-5 pt-4 pb-2 flex-shrink-0 space-y-2">
                  <button
                    onClick={() => setStep("paste")}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    Wróć do edycji
                  </button>
                  <p className="text-sm text-muted-foreground">
                    Ustaw dane dla każdego z <span className="font-semibold text-foreground">{wordsWithMeta.length}</span> słów:
                  </p>

                  {/* Apply to all */}
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground self-center">Ustaw wszystkim:</span>
                    {partOfSpeechOptions.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => applyToAll("part_of_speech", p.value)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Per-word list */}
                <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-2 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {wordsWithMeta.map((w, i) => (
                    <div key={i} className="p-3 rounded-xl bg-secondary/30 border border-border space-y-2">
                      <div>
                        <span className="text-sm font-semibold">{w.word}</span>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{w.definition}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <select
                          value={w.part_of_speech}
                          onChange={(e) => updateWordMeta(i, "part_of_speech", e.target.value)}
                          className={inputClass}
                        >
                          {partOfSpeechOptions.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                        <select
                          value={w.category}
                          onChange={(e) => updateWordMeta(i, "category", e.target.value)}
                          className={inputClass}
                        >
                          {editableCategories.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <select
                          value={w.difficulty}
                          onChange={(e) => updateWordMeta(i, "difficulty", e.target.value)}
                          className={inputClass}
                        >
                          {difficultyOptions.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Import button */}
                <div className="px-5 pb-5 pt-2 flex-shrink-0 space-y-2">
                  {importing && (
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  )}
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    <Upload size={16} />
                    {importing ? `Importowanie... ${importProgress}%` : `Importuj ${wordsWithMeta.length} słów`}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
