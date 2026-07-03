import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2, Copy, ExternalLink, ArrowLeft } from "lucide-react";
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

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

interface Props {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

type Step = 1 | 2 | 3;

function buildPrompt(opts: {
  prompt: string;
  count: number;
  category: string;
  difficulty: string;
  tags: string[];
  avoid: string[];
}) {
  const { prompt, count, category, difficulty, tags, avoid } = opts;
  const tagLine = tags.length ? tags.join(", ") : "(dowolne pasujące)";
  const avoidBlock = avoid.length
    ? `\nUNIKAJ tych słów (już istnieją w bazie kategorii „${category}"):\n${avoid.join(", ")}\n`
    : "";

  return `Jesteś leksykografem języka polskiego. Wygeneruj ${count} unikalnych polskich słów dopasowanych do tematu: „${prompt}".

WYMAGANIA:
- Każde słowo MUSI istnieć w języku polskim (norma SJP/PWN), poprawna pisownia.
- Forma podstawowa (rzeczownik: mianownik l.poj.; czasownik: bezokolicznik; przymiotnik: m. l.poj.).
- Słowo i definicja zaczynają się wielką literą.
- definition: pełna, precyzyjna (1-2 zdania).
- simplified_definition: prostym językiem, dla początkujących (1 zdanie).
- example_sentence: naturalne polskie zdanie z użyciem słowa.
- etymology: krótka i prawdziwa, lub pusty string "".
- stylistic_tags: 1-5 tagów po polsku (np. "poetyckie","archaiczne","ironiczne","wulgarne","podniosłe"). Sugerowane: ${tagLine}.
- ai_confidence_score: 0.0-1.0 — twoja pewność co do poprawności hasła.

Kategoria: ${category}
Trudność: ${difficulty}
${avoidBlock}
FORMAT ODPOWIEDZI:
Zwróć WYŁĄCZNIE poprawny JSON array (bez markdown, bez \`\`\`, bez komentarzy, bez tekstu wstępu). Schema każdego obiektu:

[
  {
    "word": "string",
    "part_of_speech": "string",
    "definition": "string",
    "simplified_definition": "string",
    "example_sentence": "string",
    "etymology": "string",
    "stylistic_tags": ["string"],
    "ai_confidence_score": 0.0
  }
]

Wygeneruj dokładnie ${count} obiektów.`;
}

function tryParseJsonArray(raw: string): any[] | null {
  const trimmed = raw.trim();
  try {
    const v = JSON.parse(trimmed);
    if (Array.isArray(v)) return v;
  } catch {
    /* fall through */
  }
  // Fallback: extract first [...] block
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try {
      const v = JSON.parse(trimmed.slice(start, end + 1));
      if (Array.isArray(v)) return v;
    } catch {
      return null;
    }
  }
  return null;
}

export function ChatGPTPromptDialog({ open, onClose, onDone }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(20);
  const [category, setCategory] = useState("ogólne");
  const [difficulty, setDifficulty] = useState("advanced");
  const [tagsRaw, setTagsRaw] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [avoidList, setAvoidList] = useState<string[]>([]);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    done: number;
    total: number;
    phase: "walidacja" | "zapis";
  } | null>(null);

  const reset = () => {
    setStep(1);
    setPrompt("");
    setTagsRaw("");
    setGeneratedPrompt("");
    setAvoidList([]);
    setJsonInput("");
    setImportProgress(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const goToStep2 = async () => {
    if (!prompt.trim()) return;
    setLoadingPrompt(true);
    try {
      const [{ data: globals }, { data: pendings }] = await Promise.all([
        supabase.from("global_words").select("word").eq("category", category),
        (supabase.from("pending_words" as any) as any)
          .select("word, verification_status")
          .eq("category", category)
          .in("verification_status", ["pending", "approved"]),
      ]);
      const set = new Set<string>();
      ((globals as any[]) || []).forEach((r) => set.add(cap(r.word.trim())));
      ((pendings as any[]) || []).forEach((r) => set.add(cap(r.word.trim())));
      const avoid = Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
      const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
      setAvoidList(avoid);
      setGeneratedPrompt(
        buildPrompt({ prompt: prompt.trim(), count, category, difficulty, tags, avoid }),
      );
      setStep(2);
    } catch (e: any) {
      toast.error(e.message || "Nie udało się pobrać listy słów");
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      toast.success("Skopiowano prompt do schowka");
    } catch {
      toast.error("Nie udało się skopiować");
    }
  };

  const handleInsert = async () => {
    if (!jsonInput.trim()) return;
    const parsed = tryParseJsonArray(jsonInput);
    if (!parsed) {
      toast.error("Nie udało się sparsować JSON. Sprawdź format.");
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading(`Przetwarzam ${parsed.length} słów...`);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id || null;

      // Refresh existence set
      const [{ data: globals }, { data: pendings }] = await Promise.all([
        supabase.from("global_words").select("word"),
        (supabase.from("pending_words" as any) as any).select("word"),
      ]);
      const existing = new Set<string>([
        ...(((globals as any[]) || []).map((r: any) => norm(r.word))),
        ...(((pendings as any[]) || []).map((r: any) => norm(r.word))),
      ]);

      const batchId = (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : `batch-${Date.now()}`;
      const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);

      const rows: any[] = [];
      let invalid = 0;
      let duplicates = 0;
      for (const item of parsed) {
        if (
          !item ||
          typeof item.word !== "string" ||
          typeof item.definition !== "string" ||
          !item.word.trim() ||
          !item.definition.trim()
        ) {
          invalid++;
          continue;
        }
        const key = norm(item.word);
        if (existing.has(key)) {
          duplicates++;
          continue;
        }
        existing.add(key);
        rows.push({
          word: cap(String(item.word).trim()),
          part_of_speech: String(item.part_of_speech || "").trim(),
          definition: cap(String(item.definition).trim()),
          simplified_definition: cap(String(item.simplified_definition || "").trim()),
          example_sentence: String(item.example_sentence || "").trim(),
          etymology: String(item.etymology || "").trim() || null,
          dictionary_source: "ai:chatgpt-manual",
          source_url: null,
          stylistic_tags: Array.isArray(item.stylistic_tags)
            ? item.stylistic_tags.map(String).filter(Boolean)
            : tags,
          difficulty_level: difficulty,
          category,
          ai_confidence_score:
            typeof item.ai_confidence_score === "number" ? item.ai_confidence_score : null,
          created_by_ai: true,
          verification_status: "pending",
          batch_id: batchId,
          batch_prompt: prompt.trim(),
          created_by: userId,
        });
      }

      if (rows.length === 0) {
        toast.error(
          `Nic nie dodano. Duplikaty: ${duplicates}, błędne: ${invalid}`,
          { id: toastId },
        );
        setSubmitting(false);
        return;
      }

      const { error } = await (supabase.from("pending_words" as any) as any).insert(rows as any);
      if (error) throw error;

      toast.success(
        `Dodano ${rows.length}/${parsed.length}${
          duplicates ? ` (duplikaty: ${duplicates})` : ""
        }${invalid ? ` (błędne: ${invalid})` : ""}`,
        { id: toastId },
      );
      onDone();
      handleClose();
    } catch (e: any) {
      toast.error(e.message || "Nie udało się zapisać", { id: toastId });
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
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button
                    onClick={() => setStep((step - 1) as Step)}
                    className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <h2
                  className="text-lg font-semibold flex items-center gap-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <Sparkles size={18} className="text-primary" />
                  {step === 1 ? "Prompt do ChatGPT" : step === 2 ? "Skopiuj prompt" : "Wklej odpowiedź"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{step}/3</span>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto">
              {step === 1 && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Temat / prompt</label>
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="np. poetyckie wyzwiska"
                      className={inputClass}
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
                      max={50}
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Kategoria</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={inputClass}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Trudność</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className={inputClass}
                      >
                        {DIFFICULTIES.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      Tagi stylistyczne (oddziel przecinkami)
                    </label>
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
                    onClick={goToStep2}
                    disabled={!prompt.trim() || loadingPrompt}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingPrompt ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Pobieram istniejące słowa...
                      </>
                    ) : (
                      <>Wygeneruj prompt</>
                    )}
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="text-[11px] text-muted-foreground">
                    Skopiuj prompt, wklej do ChatGPT (najlepiej GPT-5/o-series), poczekaj na odpowiedź i wróć tu z gotowym JSON-em.
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Lista pomijanych słów w kategorii „{category}": <span className="text-foreground font-medium">{avoidList.length}</span>
                  </p>
                  <textarea
                    value={generatedPrompt}
                    readOnly
                    className={`${inputClass} font-mono text-[11px] leading-relaxed`}
                    rows={14}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Copy size={14} />
                      Kopiuj prompt
                    </button>
                    <a
                      href="https://chat.openai.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ExternalLink size={14} />
                      Otwórz ChatGPT
                    </a>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-2 rounded-xl bg-secondary/50 text-secondary-foreground text-xs font-medium hover:bg-secondary transition-colors cursor-pointer"
                  >
                    Mam już odpowiedź → wklej JSON
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="text-[11px] text-muted-foreground">
                    Wklej całą odpowiedź ChatGPT. Akceptujemy czysty JSON array lub tekst zawierający <code>[...]</code>.
                  </p>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='[{"word":"...", "definition":"...", ...}]'
                    className={`${inputClass} font-mono text-[11px] leading-relaxed`}
                    rows={14}
                  />
                  <button
                    onClick={handleInsert}
                    disabled={submitting || !jsonInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Zapisuję...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Dodaj do kolejki
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Słowa trafią do kolejki moderacji. Nic nie zostanie opublikowane automatycznie.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
