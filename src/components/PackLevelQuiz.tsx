import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Heart, Trophy, RotateCcw } from "lucide-react";
import type { PolishWord } from "@/data/words";
import { supabase } from "@/integrations/supabase/client";

const QUESTIONS_PER_LEVEL = 15;
const STARTING_LIVES = 3;

interface PackLevelQuizProps {
  level: number;
  packId: string;
  packLabel: string;
  pool: PolishWord[]; // słowa z paczki
  allWords: PolishWord[]; // do dystraktorów (fallback)
  onExit: () => void;
  onPassed: () => void; // poziom zaliczony
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Question {
  word: PolishWord;
  options: PolishWord[];
}

function buildQuestions(pool: PolishWord[], allWords: PolishWord[], count: number): Question[] {
  if (pool.length === 0) return [];
  // Wylosuj 'count' słów z puli — z powtórzeniami jeśli pula mniejsza
  const base = shuffle(pool);
  const picks: PolishWord[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(base[i % base.length]);
  }
  return picks.map((w) => {
    const others = pool.filter((x) => x.id !== w.id);
    const distractorPool = others.length >= 3 ? others : allWords.filter((x) => x.id !== w.id);
    const samePos = distractorPool.filter((x) => x.partOfSpeech === w.partOfSpeech);
    const candidates = samePos.length >= 3 ? samePos : distractorPool;
    const distractors = shuffle(candidates).slice(0, 3);
    return { word: w, options: shuffle([w, ...distractors]) };
  });
}

export function PackLevelQuiz({ level, packId, packLabel, pool, allWords, onExit, onPassed }: PackLevelQuizProps) {
  const [levelPool, setLevelPool] = useState<PolishWord[] | null>(null);
  const [poolReady, setPoolReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPoolReady(false);
      const [{ data: lvlData }, { data: baseData }] = await Promise.all([
        supabase
          .from("pack_level_words")
          .select("word_id, position")
          .eq("pack_id", packId)
          .eq("level", level)
          .order("position", { ascending: true }),
        supabase
          .from("pack_words")
          .select("word_id, position")
          .eq("pack_id", packId)
          .order("position", { ascending: true }),
      ]);
      if (cancelled) return;
      const byId = new Map(pool.map((w) => [w.id, w]));
      const fromAll = new Map(allWords.map((w) => [w.id, w]));
      const resolve = (ids: string[]) =>
        ids.map((id) => byId.get(id) ?? fromAll.get(id)).filter(Boolean) as PolishWord[];

      if (lvlData && lvlData.length > 0) {
        const picks = resolve(lvlData.map((r) => r.word_id));
        setLevelPool(picks.length > 0 ? picks : null);
      } else if (baseData && baseData.length > 0) {
        // Fallback: użyj bazy paczki
        const picks = resolve(baseData.map((r) => r.word_id));
        setLevelPool(picks.length > 0 ? picks : null);
      } else {
        setLevelPool(null);
      }
      setPoolReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [packId, level, pool, allWords]);

  const effectivePool = levelPool ?? pool;
  const questions = useMemo(
    () => buildQuestions(effectivePool, allWords, QUESTIONS_PER_LEVEL),
    [effectivePool, allWords, level],
  );
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [correct, setCorrect] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");

  const q = questions[idx];

  const handleAnswer = (optId: string) => {
    if (locked || !q) return;
    setSelectedId(optId);
    setLocked(true);
    const isCorrect = optId === q.word.id;
    if (isCorrect) {
      setCorrect((c) => c + 1);
    } else {
      setLives((l) => {
        const nl = l - 1;
        if (nl <= 0) {
          setTimeout(() => setPhase("lost"), 700);
        }
        return nl;
      });
    }
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        // Zaliczone — wystarczy że dotrwał z >=1 życiem
        setPhase("won");
        onPassed();
      } else {
        setIdx((i) => i + 1);
        setSelectedId(null);
        setLocked(false);
      }
    }, 700);
  };

  const handleRestart = () => {
    setIdx(0);
    setLives(STARTING_LIVES);
    setCorrect(0);
    setSelectedId(null);
    setLocked(false);
    setPhase("playing");
  };

  if (phase === "won") {
    return (
      <ResultScreen
        title={`Poziom ${level} zaliczony!`}
        subtitle={`Poprawnie: ${correct}/${questions.length}`}
        success
        onPrimary={onExit}
        primaryLabel="Powrót do mapy"
      />
    );
  }

  if (phase === "lost") {
    return (
      <ResultScreen
        title="Koniec żyć"
        subtitle={`Doszedłeś do pytania ${idx + 1}/${questions.length}`}
        onPrimary={handleRestart}
        primaryLabel="Spróbuj ponownie"
        onSecondary={onExit}
        secondaryLabel="Mapa"
      />
    );
  }

  if (!q) {
    return (
      <ResultScreen
        title="Brak słów w paczce"
        subtitle="Spróbuj inną paczkę"
        onPrimary={onExit}
        primaryLabel="Powrót"
      />
    );
  }

  const progressPct = (idx / questions.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-background flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Nagłówek z postępem i życiami */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <button
          onClick={onExit}
          aria-label="Wyjdź"
          className="h-9 w-9 -ml-1 flex items-center justify-center text-foreground/70 hover:text-foreground"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: STARTING_LIVES }).map((_, i) => (
            <Heart
              key={i}
              size={18}
              className={i < lives ? "fill-primary text-primary" : "text-muted-foreground/30"}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pt-1 pb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{packLabel} · Poziom {level}</span>
        <span>{idx + 1} / {questions.length}</span>
      </div>

      {/* Pytanie */}
      <div className="flex-1 flex flex-col px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <div className="pt-4 pb-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Które słowo pasuje do definicji?
              </p>
              <p
                className="text-lg leading-snug text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {q.word.definition}
              </p>
            </div>

            <div className="space-y-2.5 mt-auto pb-6">
              {q.options.map((opt) => {
                const isSelected = selectedId === opt.id;
                const isCorrect = opt.id === q.word.id;
                const showResult = locked;
                let cls = "border-border bg-card hover:bg-secondary/50";
                if (showResult && isCorrect) cls = "border-primary bg-primary/15 text-foreground";
                else if (showResult && isSelected && !isCorrect) cls = "border-destructive bg-destructive/10 text-foreground";
                else if (showResult) cls = "border-border bg-card opacity-60";
                return (
                  <motion.button
                    key={opt.id}
                    whileTap={{ scale: locked ? 1 : 0.98 }}
                    onClick={() => handleAnswer(opt.id)}
                    disabled={locked}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${cls}`}
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {opt.word}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ResultScreen({
  title,
  subtitle,
  success,
  onPrimary,
  primaryLabel,
  onSecondary,
  secondaryLabel,
}: {
  title: string;
  subtitle?: string;
  success?: boolean;
  onPrimary: () => void;
  primaryLabel: string;
  onSecondary?: () => void;
  secondaryLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] bg-background flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="space-y-5 max-w-sm"
      >
        {success ? (
          <Trophy size={56} className="mx-auto text-primary" />
        ) : (
          <RotateCcw size={48} className="mx-auto text-muted-foreground" />
        )}
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={onPrimary}
            className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {primaryLabel}
          </button>
          {onSecondary && secondaryLabel && (
            <button
              onClick={onSecondary}
              className="px-5 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
