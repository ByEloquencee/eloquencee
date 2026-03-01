import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, RotateCcw, Pencil, Trash2, UserRound, ChevronLeft, Lightbulb } from "lucide-react";
import type { PolishWord } from "@/data/words";
import { getFolderIcon } from "@/components/CreateFolderDialog";
import { SpiderWeb } from "@/components/SpiderWeb";
import type { Folder } from "@/hooks/use-folders";

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
  folders?: Folder[];
  onToggleFolder?: (folderId: string) => void;
}

export function WordCard({ word, isFavorite, onToggleFavorite, onNext, onPrev, canGoBack, isCustom, onEdit, onDelete, onAskAI, folders = [], onToggleFolder }: WordCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleReveal = () => setRevealed(true);

  const handleNext = useCallback(() => {
    setRevealed(false);
    setConfirmDelete(false);
    onNext();
  }, [onNext]);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete?.();
    setConfirmDelete(false);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={word.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg mx-auto"
      >
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden relative">
          {/* Header */}
          <div className="px-6 pt-8 pb-4 text-center relative">
            {canGoBack && (
              <button
                onClick={() => { setRevealed(false); setConfirmDelete(false); onPrev?.(); }}
                className="absolute top-3 left-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Cofnij"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div className="absolute top-3 right-3 flex gap-1">
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
            </div>
            <div className="flex items-center justify-center gap-1.5">
              {word.category === "ciekawi_ludzie" && (
                <UserRound size={14} className="text-primary" />
              )}
              <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                {word.partOfSpeech}
              </span>
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
          <div className="px-6 pb-6">
            {!revealed ? (
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
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <div className="flex items-center gap-1">
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

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                <RotateCcw size={16} />
                Nowe słowo
              </motion.button>
            </div>
          </div>
        </div>
        <SpiderWeb />
      </motion.div>
    </AnimatePresence>
  );
}
