import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface WordInfoData {
  word: string;
  partOfSpeech?: string;
  definition: string;
  example?: string;
  etymology?: string | null;
}

interface WordInfoDialogProps {
  word: WordInfoData | null;
  onClose: () => void;
}

export function WordInfoDialog({ word, onClose }: WordInfoDialogProps) {
  return (
    <AnimatePresence>
      {word && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] bg-card rounded-2xl border border-border shadow-lg overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex items-start justify-between gap-2 p-5 pb-3">
              <h2
                className="text-2xl leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {word.word}
              </h2>
              <button
                onClick={onClose}
                aria-label="Zamknij"
                className="p-1 -mt-1 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {word.partOfSpeech && (
                <span className="block text-xs font-medium tracking-widest uppercase text-muted-foreground">
                  {word.partOfSpeech}
                </span>
              )}

              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-sm leading-relaxed text-foreground">
                  {word.definition}
                </p>
              </div>

              {word.example && (
                <div className="p-4 rounded-xl border border-border">
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">
                    Przykład
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground italic whitespace-pre-line">
                    „{word.example}"
                  </p>
                </div>
              )}

              {word.etymology && (
                <p className="text-xs text-muted-foreground italic">
                  {word.etymology}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
