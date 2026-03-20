import { useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo, animate } from "framer-motion";
import { RotateCcw, X, BookOpen, ThumbsUp, ThumbsDown, RotateCw } from "lucide-react";
import type { FlashcardSet } from "@/hooks/use-flashcard-sets";
import type { PolishWord } from "@/data/words";

interface FlashcardStudyViewProps {
  set: FlashcardSet;
  onExit: () => void;
}

type SwipeDirection = "left" | "right" | null;

export function FlashcardStudyView({ set, onExit }: FlashcardStudyViewProps) {
  const [cards, setCards] = useState<PolishWord[]>(set.cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<PolishWord[]>([]);
  const [unknown, setUnknown] = useState<PolishWord[]>([]);
  const [finished, setFinished] = useState(false);
  const [swipeHint, setSwipeHint] = useState<SwipeDirection>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const absDragX = useTransform(dragX, (v) => Math.abs(v));
  const nextCardScale = useTransform(absDragX, [0, 150], [0.95, 1]);
  const dragRotate = useTransform(dragX, [-200, 0, 200], [-12, 0, 12]);
  const dragY = useTransform(dragX, [-200, 0, 200], [30, 0, 30]);
  const dragShadow = useTransform(dragX, [-200, -80, 0, 80, 200], [
    "0 20px 40px -8px rgba(0,0,0,0.3)",
    "0 12px 24px -6px rgba(0,0,0,0.18)",
    "0 2px 8px -2px rgba(0,0,0,0.08)",
    "0 12px 24px -6px rgba(0,0,0,0.18)",
    "0 20px 40px -8px rgba(0,0,0,0.3)",
  ]);
  const dragBorder = useTransform(dragX, [-120, -60, 0, 60, 120], [
    "2px solid hsl(0 84% 60%)",
    "2px solid hsl(0 84% 60% / 0.4)",
    "1px solid hsl(var(--border))",
    "2px solid hsl(142 71% 45% / 0.4)",
    "2px solid hsl(142 71% 45%)",
  ]);

  const card = cards[index];
  const total = cards.length;

  const handleResult = useCallback(
    async (isKnown: boolean) => {
      if (!card || isTransitioning) return;

      setIsTransitioning(true);

      if (isKnown) {
        setKnown((prev) => [...prev, card]);
      } else {
        setUnknown((prev) => [...prev, card]);
      }

      setFlipped(false);
      setSwipeHint(null);

      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 400;
      const swipeTarget = (isKnown ? 1 : -1) * viewportWidth * 1.2;

      await animate(dragX, swipeTarget, {
        type: "tween",
        ease: "easeIn",
        duration: 0.22,
      }).finished;

      if (index >= total - 1) {
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
      }

      dragX.set(0);
      setIsTransitioning(false);
    },
    [card, dragX, index, isTransitioning, total]
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 80;

      if (info.offset.x > threshold) {
        void handleResult(true);
        return;
      }

      if (info.offset.x < -threshold) {
        void handleResult(false);
        return;
      }

      setSwipeHint(null);
      void animate(dragX, 0, {
        type: "spring",
        stiffness: 320,
        damping: 28,
      });
    },
    [dragX, handleResult]
  );

  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isTransitioning) return;
    if (info.offset.x > 40) setSwipeHint("right");
    else if (info.offset.x < -40) setSwipeHint("left");
    else setSwipeHint(null);
  }, [isTransitioning]);

  const restartAll = () => {
    dragX.set(0);
    setCards(set.cards);
    setIndex(0);
    setFlipped(false);
    setKnown([]);
    setUnknown([]);
    setFinished(false);
    setSwipeHint(null);
    setIsTransitioning(false);
  };

  const studyUnknown = () => {
    dragX.set(0);
    setCards(unknown);
    setIndex(0);
    setFlipped(false);
    setKnown([]);
    setUnknown([]);
    setFinished(false);
    setSwipeHint(null);
    setIsTransitioning(false);
  };

  if (finished) {
    const knownCount = known.length;
    const unknownCount = unknown.length;
    const percentage = total > 0 ? Math.round((knownCount / total) * 100) : 0;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="space-y-2">
            <h2
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Wyniki
            </h2>
            <p className="text-sm text-muted-foreground">{set.title}</p>
          </div>

          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{knownCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Umiem</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-destructive">{unknownCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Nie umiem</p>
            </div>
          </div>

          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{percentage}% opanowane</p>

          <div className="space-y-3 pt-4">
            {unknownCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={studyUnknown}
                className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCw size={16} />
                Ucz się nieznanych ({unknownCount})
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={restartAll}
              className="w-full py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors cursor-pointer flex items-center justify-center gap-2 text-foreground"
            >
              <RotateCcw size={16} />
              Powtórz cały zestaw
            </motion.button>

            <button
              onClick={onExit}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Zakończ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <button
          onClick={onExit}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
        <div className="text-center">
          <h2
            className="text-sm font-semibold truncate max-w-[200px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {set.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {index + 1} / {total}
          </p>
        </div>
        <button
          onClick={restartAll}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      <div className="w-full max-w-lg mx-auto px-4 pb-6">
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto px-4 flex justify-between pointer-events-none">
        <motion.div
          animate={{ opacity: swipeHint === "left" ? 1 : 0, scale: swipeHint === "left" ? 1 : 0.8 }}
          className="flex items-center gap-1.5 text-destructive text-xs font-medium"
        >
          <ThumbsDown size={14} />
          Nie umiem
        </motion.div>
        <motion.div
          animate={{ opacity: swipeHint === "right" ? 1 : 0, scale: swipeHint === "right" ? 1 : 0.8 }}
          className="flex items-center gap-1.5 text-primary text-xs font-medium"
        >
          Umiem
          <ThumbsUp size={14} />
        </motion.div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="relative w-full max-w-sm">
          <div aria-hidden className="w-full aspect-[3/4] max-h-[50vh] pointer-events-none opacity-0" />

          {index < total - 1 && (
            <motion.div className="absolute inset-0" style={{ scale: nextCardScale }}>
              <div className="h-full w-full rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
                  Termin
                </span>
                <p
                  className="font-semibold leading-snug text-center break-words w-full mt-3"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: `clamp(1rem, ${Math.max(1, 1.875 - cards[index + 1].word.length / 80)}rem, 1.875rem)`,
                  }}
                >
                  {cards[index + 1].word}
                </p>
              </div>
            </motion.div>
          )}

          <motion.div
            key={`${index}-${cards.length}`}
            className="absolute inset-0 z-10"
            drag={isTransitioning ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{ x: dragX, rotate: dragRotate, y: dragY, boxShadow: dragShadow }}
          >
            <motion.button
              onClick={() => !isTransitioning && setFlipped((f) => !f)}
              className="h-full w-full rounded-2xl bg-card p-6 flex flex-col items-center justify-center cursor-pointer overflow-hidden text-center"
              style={{ border: dragBorder }}
              whileTap={{ scale: 0.98 }}
              disabled={isTransitioning}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={flipped ? "back" : "front"}
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-3 w-full"
                >
                  <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
                    {flipped ? "Definicja" : "Termin"}
                  </span>
                  <p
                    className="font-semibold leading-snug text-center break-words w-full"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: flipped
                        ? `clamp(1rem, ${Math.max(1, 2 - card.definition.length / 150)}rem, 2rem)`
                        : `clamp(1rem, ${Math.max(1, 1.875 - card.word.length / 80)}rem, 1.875rem)`,
                    }}
                  >
                    {flipped ? card.definition : card.word}
                  </p>
                  {!flipped && (
                    <span className="text-xs text-muted-foreground mt-2">
                      Stuknij, aby obrócić
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </div>
      </main>

      <div className="w-full max-w-lg mx-auto px-4 pb-8 flex items-center justify-center gap-4">
        <button
          onClick={() => void handleResult(false)}
          disabled={isTransitioning}
          className="p-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <ThumbsDown size={18} />
          <span className="text-xs font-medium">Nie umiem</span>
        </button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen size={14} />
          <span>{total} fiszek</span>
        </div>
        <button
          onClick={() => void handleResult(true)}
          disabled={isTransitioning}
          className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <span className="text-xs font-medium">Umiem</span>
          <ThumbsUp size={18} />
        </button>
      </div>
    </div>
  );
}
