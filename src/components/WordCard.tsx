import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, RotateCcw, Pencil, Trash2, UserRound, ChevronLeft, Lightbulb, Volume2, Share2, ChevronUp } from "lucide-react";
import type { PolishWord } from "@/data/words";
import { getFolderIcon } from "@/components/CreateFolderDialog";
import { SpiderWeb } from "@/components/SpiderWeb";
import { WordExtraInfo } from "@/components/WordExtraInfo";
import type { Folder } from "@/hooks/use-folders";
import type { DifficultyLevel } from "@/hooks/use-profile";

interface WordCardProps {
  word: PolishWord;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onNext: () => void;
  onPrev?: () => void;
  canGoBack?: boolean;
  isCustom?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAskAI?: () => void;
  onShare?: () => void;
  folders?: Folder[];
  onToggleFolder?: (folderId: string) => void;
  difficultyLevel?: DifficultyLevel;
}

export function WordCard({ word, isFavorite, onToggleFavorite, onNext, onPrev, canGoBack, isCustom, onEdit, onDelete, onAskAI, onShare, folders = [], onToggleFolder, difficultyLevel = "advanced" }: WordCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [swipeDir, setSwipeDir] = useState<"up" | "down">("up");
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show pronunciation for foreign-origin words and historical figures
  const hasPronunciation = word.category === "ciekawi_ludzie" || !!word.etymology;

  const handleSpeak = useCallback(() => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(word.word);
    // Try to detect language from etymology or category
    if (word.category === "ciekawi_ludzie") {
      utterance.lang = "pl-PL"; // Polish pronunciation for names in context
    } else {
      utterance.lang = "pl-PL";
    }
    utterance.rate = 0.85;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [word.word, word.category, speaking]);

  const handleReveal = () => setRevealed(true);

  const handleNext = useCallback(() => {
    setSwipeDir("up");
    setRevealed(false);
    setConfirmDelete(false);
    onNext();
  }, [onNext]);

  const handlePrevAction = useCallback(() => {
    setSwipeDir("down");
    setRevealed(false);
    setConfirmDelete(false);
    onPrev?.();
  }, [onPrev]);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete?.();
    setConfirmDelete(false);
  };

  const startHold = () => {
    holdTimerRef.current = setTimeout(() => setZenMode(true), 1000);
  };

  const endHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setZenMode(false);
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const cardVariants = {
    enter: (dir: string) => ({ opacity: 0, y: dir === "up" ? 300 : -300 }),
    center: { opacity: 1, y: 0 },
    exit: (dir: string) => ({ opacity: 0, y: dir === "up" ? -300 : 300 }),
  };

  return (
    <AnimatePresence mode="popLayout" custom={swipeDir}>
      <motion.div
        key={word.id}
        custom={swipeDir}
        variants={cardVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg mx-auto"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.3}
        onDragEnd={(_, info) => {
          const threshold = 50;
          if (info.offset.y < -threshold) {
            handleNext();
          } else if (info.offset.y > threshold && canGoBack) {
            handlePrevAction();
          }
        }}
        style={{ touchAction: "pan-x" }}
      >
        <div
          className="bg-card rounded-2xl border border-border shadow-sm overflow-visible relative select-none"
        >
          {/* Header */}
          <div className="px-6 pt-8 pb-4 text-center relative">
            <AnimatePresence>
              {!zenMode && canGoBack && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => handlePrevAction()}
                  className="absolute top-3 left-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Cofnij"
                >
                  <ChevronLeft size={18} />
                </motion.button>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!zenMode && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute top-3 right-3 flex gap-1"
                >
                  <button
                    onClick={onShare}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                    title="Udostępnij"
                  >
                    <Share2 size={14} />
                  </button>
                  <button
                    onClick={onAskAI}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                    title="Zapytaj AI"
                  >
                    <Lightbulb size={14} />
                  </button>
                  {isCustom && (
                    <>
                      <button
                        onClick={onEdit}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        title="Edytuj"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={handleDelete}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          confirmDelete
                            ? "bg-destructive text-destructive-foreground"
                            : "text-muted-foreground hover:text-destructive hover:bg-secondary"
                        }`}
                        title={confirmDelete ? "Kliknij ponownie, aby usunąć" : "Usuń"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center justify-center gap-1.5">
              {word.category === "ciekawi_ludzie" && (
                <UserRound size={14} className="text-primary" />
              )}
              <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                {word.partOfSpeech}
              </span>
              <AnimatePresence>
                {!zenMode && hasPronunciation && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={handleSpeak}
                    className={`p-1 rounded-full transition-colors cursor-pointer ${
                      speaking
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    }`}
                    title="Odsłuchaj wymowę"
                  >
                    <Volume2 size={14} className={speaking ? "animate-pulse" : ""} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {word.word}
            </h1>
            {word.etymology && (
              <p className="mt-2 text-sm text-muted-foreground italic">
                {word.etymology}
              </p>
            )}
          </div>

          {/* Definition area */}
          <div className="px-6 pb-6 max-h-[50vh] overflow-y-auto">
            {!revealed && !zenMode ? (
              <motion.button
                onClick={handleReveal}
                whileTap={{ scale: 0.97 }}
                className="w-full mt-4 py-4 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium tracking-wide hover:opacity-90 transition-opacity cursor-pointer"
              >
                Pokaż definicję
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="mt-4 space-y-4"
              >
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-base leading-relaxed text-foreground">
                    {word.definition}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border">
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">
                    Przykład
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    „{word.example}"
                  </p>
                </div>
                <WordExtraInfo word={word} difficultyLevel={difficultyLevel} />
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <AnimatePresence>
            {!zenMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="px-6 pb-6 flex items-center justify-between gap-2 min-w-0"
              >
                <div className="flex items-center gap-1 min-w-0 overflow-x-auto flex-shrink [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onToggleFavorite}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <Heart
                      size={20}
                      className={isFavorite ? "fill-primary text-primary" : ""}
                    />
                  </motion.button>
                  {folders.map((f) => {
                    const Icon = getFolderIcon(f.icon);
                    const isIn = f.wordIds.includes(word.id);
                    return (
                      <motion.button
                        key={f.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onToggleFolder?.(f.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isIn ? "text-primary" : "text-muted-foreground hover:text-primary"
                        }`}
                        title={`${isIn ? "Usuń z" : "Dodaj do"} "${f.name}"`}
                      >
                        <Icon size={18} className={isIn ? "fill-primary" : ""} />
                      </motion.button>
                    );
                  })}
                </div>

                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNext}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <RotateCcw size={16} />
                    Nowe słowo
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <SpiderWeb />
        </div>
        {/* Mobile swipe hint */}
        <motion.div
          className="md:hidden flex flex-col items-center mt-3 text-muted-foreground/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronUp size={18} />
          </motion.div>
          <span className="text-[10px] tracking-wide">przesuń w górę</span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
