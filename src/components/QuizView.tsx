import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, X, Trophy, ChevronLeft, ChevronRight, BookOpen, Keyboard, ArrowRight, Heart, FolderPlus } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useFolders } from "@/hooks/use-folders";
import { getFolderIcon } from "@/components/CreateFolderDialog";
import { useToast } from "@/hooks/use-toast";
import type { PolishWord } from "@/data/words";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type QuizMode = "multiple-choice" | "typing";

interface QuizViewProps {
  words: PolishWord[];
  allWords: PolishWord[];
  onExit: () => void;
  onComplete?: (correctCount: number) => void;
  mode?: QuizMode;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestion(word: PolishWord, pool: PolishWord[]) {
  const others = pool.filter((w) => w.id !== word.id);
  const samePoS = others.filter((w) => w.partOfSpeech === word.partOfSpeech);
  const sameCat = others.filter((w) => w.category === word.category && w.partOfSpeech === word.partOfSpeech);

  let candidates: PolishWord[];
  if (sameCat.length >= 3) candidates = sameCat;
  else if (samePoS.length >= 3) candidates = samePoS;
  else candidates = others;

  const distractors = shuffle(candidates).slice(0, 3);
  const options = shuffle([word, ...distractors]);
  return { word, definition: word.definition, correctId: word.id, options };
}

// ─── Results Screen ───
function ResultsScreen({ score, total, onExit, onRestart }: { score: number; total: number; onExit: () => void; onRestart: () => void }) {
  const pct = Math.round((score / total) * 100);
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4 max-w-sm">
        <Trophy size={56} className="mx-auto text-primary" />
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Wynik: {score}/{total}</h2>
        <p className="text-muted-foreground text-sm">{pct}% poprawnych odpowiedzi</p>
        <div className="flex gap-3 justify-center pt-4">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onExit} className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium cursor-pointer hover:bg-secondary/80 transition-colors">Wróć</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onRestart} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">Jeszcze raz</motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Inspect Dialog ───
function InspectDialog({ word, onClose }: { word: PolishWord | null; onClose: () => void }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { folders, toggleWordInFolder, isWordInFolder } = useFolders();
  const { toast } = useToast();
  const [showFolders, setShowFolders] = useState(false);

  const isFav = word ? isFavorite(word.id) : false;

  const handleToggleFavorite = async () => {
    if (!word) return;
    await toggleFavorite(word.id);
    toast({ title: isFav ? "Usunięto z ulubionych" : "Dodano do ulubionych", duration: 1500 });
  };

  const handleToggleFolder = async (folderId: string) => {
    if (!word) return;
    const wasIn = isWordInFolder(folderId, word.id);
    await toggleWordInFolder(folderId, word.id);
    const folder = folders.find(f => f.id === folderId);
    toast({ title: wasIn ? `Usunięto z „${folder?.name}"` : `Dodano do „${folder?.name}"`, duration: 1500 });
  };

  return (
    <Dialog open={!!word} onOpenChange={(o) => { if (!o) { setShowFolders(false); onClose(); } }}>
      <DialogContent className="max-w-sm rounded-2xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>{word?.word}</DialogTitle>
            {word && (
              <div className="flex items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleToggleFavorite}
                  className="p-2 rounded-xl transition-colors cursor-pointer hover:bg-secondary"
                >
                  <Heart size={18} className={isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                </motion.button>
                {folders.length > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setShowFolders(!showFolders)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer hover:bg-secondary ${showFolders ? "bg-secondary text-primary" : "text-muted-foreground"}`}
                  >
                    <FolderPlus size={18} />
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        {word && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-3"
          >
            <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">{word.partOfSpeech}</span>

            <AnimatePresence>
              {showFolders && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {folders.map((folder) => {
                      const FolderIcon = getFolderIcon(folder.icon);
                      const isIn = isWordInFolder(folder.id, word.id);
                      return (
                        <motion.button
                          key={folder.id}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleToggleFolder(folder.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                            isIn
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80"
                          }`}
                        >
                          <FolderIcon size={13} />
                          {folder.name}
                          {isIn && <Check size={12} />}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.2 }}
              className="p-4 rounded-xl bg-secondary/50"
            >
              <p className="text-sm leading-relaxed text-foreground">{word.definition}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="p-4 rounded-xl border border-border"
            >
              <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">Przykład</p>
              <p className="text-sm leading-relaxed text-muted-foreground italic">„{word.example}"</p>
            </motion.div>
            {word.etymology && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                className="text-xs text-muted-foreground italic"
              >{word.etymology}</motion.p>
            )}
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Multiple Choice Question ───
function MultipleChoiceQuestion({
  question,
  selected,
  onSelect,
  onInspect,
}: {
  question: ReturnType<typeof generateQuestion>;
  selected: string | null;
  onSelect: (id: string) => void;
  onInspect: (word: PolishWord) => void;
}) {
  return (
    <div className="w-full space-y-6">
      <div className="p-5 rounded-2xl bg-secondary/50 border border-border">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Definicja:</p>
        <p className="text-base font-medium text-foreground leading-relaxed">{question.definition}</p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {question.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.id === question.correctId;
          const showResult = selected !== null;

          let classes = "w-full p-4 rounded-xl text-left text-sm font-medium transition-all border ";
          if (showResult && isCorrect) classes += "bg-green-500/15 border-green-500/50 text-green-700 dark:text-green-400";
          else if (showResult && isSelected && !isCorrect) classes += "bg-red-500/15 border-red-500/50 text-red-700 dark:text-red-400";
          else if (showResult) classes += "bg-secondary border-border text-muted-foreground opacity-60";
          else classes += "bg-secondary border-border text-foreground hover:bg-secondary/80 cursor-pointer";

          return (
            <div
              key={opt.id}
              onClick={(e) => { if (!selected) { e.stopPropagation(); onSelect(opt.id); } }}
              className={classes}
              style={{ cursor: selected ? "default" : "pointer" }}
            >
              <span className="flex items-center justify-between">
                <span>{opt.word}</span>
                <span className="flex items-center gap-1.5">
                  {showResult && isCorrect && <Check size={16} />}
                  {showResult && isSelected && !isCorrect && <X size={16} />}
                  {showResult && (
                    <span onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} className="inline-flex">
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onInspect(opt); }}
                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        title="Sprawdź znaczenie"
                      >
                        <BookOpen size={14} />
                      </motion.button>
                    </span>
                  )}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Typing Question ───
function TypingQuestion({
  question,
  status,
  input,
  onInputChange,
  onCheck,
  correctWord,
}: {
  question: ReturnType<typeof generateQuestion>;
  status: "answering" | "correct" | "wrong";
  input: string;
  onInputChange: (v: string) => void;
  onCheck: () => void;
  correctWord: string;
}) {
  return (
    <div className="w-full space-y-6">
      <div className="p-5 rounded-2xl bg-secondary/50 border border-border text-center">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Definicja:</p>
        <p className="text-base font-medium text-foreground leading-relaxed">{question.definition}</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && status === "answering") onCheck();
            }}
            disabled={status !== "answering"}
            placeholder="Wpisz słowo..."
            autoFocus
            className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
              status === "correct"
                ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                : status === "wrong"
                ? "border-destructive bg-destructive/10"
                : "border-border bg-secondary"
            }`}
          />
          <Keyboard size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        <AnimatePresence mode="wait">
          {status === "wrong" && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-muted-foreground">Poprawna odpowiedź:</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{correctWord}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {status === "answering" && (
          <button
            onClick={onCheck}
            disabled={!input.trim()}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={16} /> Sprawdź
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main QuizView ───
export function QuizView({ words, allWords, onExit, onComplete, mode = "multiple-choice" }: QuizViewProps) {
  const questions = useMemo(() => {
    const pool = allWords.length >= 4 ? allWords : words;
    return shuffle(words).map((w) => generateQuestion(w, pool.length >= 4 ? pool : words));
  }, [words, allWords]);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [inspectWord, setInspectWord] = useState<PolishWord | null>(null);
  const [maxReached, setMaxReached] = useState(0);

  // Typing mode state
  const [typingInput, setTypingInput] = useState("");
  const [typingStatus, setTypingStatus] = useState<"answering" | "correct" | "wrong">("answering");

  const question = questions[current];
  const selected = answers[current] ?? null;
  const isAnswered = mode === "multiple-choice" ? selected !== null : typingStatus !== "answering";

  const handleSelect = useCallback(
    (id: string) => {
      if (answers[current] !== undefined) return;
      setAnswers((prev) => ({ ...prev, [current]: id }));
      if (id === question.correctId) setScore((s) => s + 1);
    },
    [answers, current, question]
  );

  const handleTypingCheck = useCallback(() => {
    if (!typingInput.trim()) return;
    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
    const isCorrect = normalize(typingInput) === normalize(question.word.word);
    setTypingStatus(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 1);
  }, [typingInput, question]);

  const handleAdvance = useCallback(() => {
    if (!isAnswered) return;
    if (inspectWord) return; // don't advance while dialog is open
    if (current + 1 >= questions.length) {
      setFinished(true);
      onComplete?.(score);
    } else {
      const next = current + 1;
      setCurrent(next);
      setMaxReached((m) => Math.max(m, next));
      // Reset typing state
      setTypingInput("");
      setTypingStatus("answering");
    }
  }, [isAnswered, inspectWord, current, questions.length, score, onComplete]);

  const handleRestart = () => {
    setCurrent(0);
    setAnswers({});
    setScore(0);
    setMaxReached(0);
    setFinished(false);
    setTypingInput("");
    setTypingStatus("answering");
  };

  const canGoBack = current > 0 && mode === "multiple-choice";
  const canGoForward = current < maxReached && mode === "multiple-choice";

  if (finished) {
    return <ResultsScreen score={score} total={questions.length} onExit={onExit} onRestart={handleRestart} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onExit} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </motion.button>
          {canGoBack && (
            <motion.button initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrent((c) => c - 1)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
              <ChevronLeft size={20} />
            </motion.button>
          )}
          {canGoForward && (
            <motion.button initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrent((c) => c + 1)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
              <ChevronRight size={20} />
            </motion.button>
          )}
        </div>
        <span className="text-sm font-medium text-muted-foreground">{current + 1} / {questions.length}</span>
        <span className="text-sm font-semibold text-primary">{score} pkt</span>
      </header>

      <main
        className="flex-1 flex flex-col items-center justify-center px-4 pb-12 max-w-lg mx-auto w-full relative"
      >
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full relative z-10">
            {mode === "multiple-choice" ? (
              <MultipleChoiceQuestion question={question} selected={selected} onSelect={handleSelect} onInspect={setInspectWord} />
            ) : (
              <TypingQuestion
                question={question}
                status={typingStatus}
                input={typingInput}
                onInputChange={setTypingInput}
                onCheck={handleTypingCheck}
                correctWord={question.word.word}
              />
            )}

            <AnimatePresence>
              {isAnswered && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-muted-foreground mt-6">
                  Kliknij aby przejść dalej
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Invisible advance overlay behind the content — clicking empty space advances */}
        {isAnswered && (
          <div
            className="absolute inset-0 cursor-pointer"
            style={{ zIndex: 0 }}
            onClick={handleAdvance}
          />
        )}
      </main>

      <InspectDialog word={inspectWord} onClose={() => setInspectWord(null)} />
    </div>
  );
}
