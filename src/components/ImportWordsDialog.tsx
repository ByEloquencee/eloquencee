import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { categories, type WordCategory } from "@/data/words";
import { useGlobalWords } from "@/hooks/use-global-words";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const editableCategories = categories.filter(c => c.value !== "all" && c.value !== "własne");
const difficultyOptions = [
  { value: "beginner", label: "Początkujący" },
  { value: "intermediate", label: "Średni" },
  { value: "advanced", label: "Zaawansowany" },
];

const inputClass = "w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring";

interface ParsedWord {
  word: string;
  definition: string;
  example: string;
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
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [meta, setMeta] = useState({
    part_of_speech: "",
    category: "ogólne",
    difficulty: "advanced",
  });
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const parseText = () => {
    const lines = rawText.trim().split("\n").filter(Boolean);
    const words: ParsedWord[] = [];

    for (const line of lines) {
      // Support formats: word | definition | example  OR  word - definition - example
      const parts = line.includes("|")
        ? line.split("|").map(s => s.trim())
        : line.split(" - ").map(s => s.trim());

      if (parts.length >= 2) {
        words.push({
          word: parts[0],
          definition: parts[1],
          example: parts[2] || "",
        });
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
    setParsedWords(words);
    setStep("metadata");
  };

  const handleImport = async () => {
    if (!user) return;
    setImporting(true);
    setImportProgress(0);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < parsedWords.length; i++) {
      const w = parsedWords[i];
      try {
        await addWord({
          word: w.word,
          definition: w.definition,
          example: w.example,
          part_of_speech: meta.part_of_speech,
          category: meta.category,
          difficulty: meta.difficulty,
          etymology: null,
          created_by: user.id,
        } as any);
        success++;
      } catch {
        failed++;
      }
      setImportProgress(Math.round(((i + 1) / parsedWords.length) * 100));
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
    setParsedWords([]);
    setMeta({ part_of_speech: "", category: "ogólne", difficulty: "advanced" });
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
            className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
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
                  className={`${inputClass} resize-none font-mono text-xs`}
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
              <div className="p-5 space-y-3">
                <button
                  onClick={() => setStep("paste")}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  Wróć do edycji
                </button>

                <p className="text-sm text-muted-foreground">
                  Importujesz <span className="font-semibold text-foreground">{parsedWords.length}</span> słów.
                  Ustaw wspólne dane dla wszystkich:
                </p>

                {/* Preview of words */}
                <div className="max-h-32 overflow-y-auto rounded-xl bg-secondary/50 border border-border p-2 space-y-1">
                  {parsedWords.map((w, i) => (
                    <div key={i} className="text-xs flex gap-2">
                      <span className="font-semibold truncate min-w-0">{w.word}</span>
                      <span className="text-muted-foreground truncate min-w-0">— {w.definition}</span>
                    </div>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Część mowy (np. przymiotnik)"
                  value={meta.part_of_speech}
                  onChange={(e) => setMeta(m => ({ ...m, part_of_speech: e.target.value }))}
                  maxLength={50}
                  className={inputClass}
                />
                <select
                  value={meta.category}
                  onChange={(e) => setMeta(m => ({ ...m, category: e.target.value }))}
                  className={inputClass}
                >
                  {editableCategories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <select
                  value={meta.difficulty}
                  onChange={(e) => setMeta(m => ({ ...m, difficulty: e.target.value }))}
                  className={inputClass}
                >
                  {difficultyOptions.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>

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
                  {importing ? `Importowanie... ${importProgress}%` : `Importuj ${parsedWords.length} słów`}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
