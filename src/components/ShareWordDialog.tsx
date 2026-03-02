import { motion } from "framer-motion";
import { Share2, Copy, Check, X } from "lucide-react";
import { useState } from "react";
import type { PolishWord } from "@/data/words";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShareWordDialogProps {
  word: PolishWord | null;
  open: boolean;
  onClose: () => void;
}

export function ShareWordDialog({ word, open, onClose }: ShareWordDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!word) return null;

  const shareText = `✨ ${word.word}\n\n📖 ${word.definition}\n\n💬 „${word.example}"\n\n— Eloquencee`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: word.word, text: shareText });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-border">
        <DialogTitle className="sr-only">Udostępnij słówko</DialogTitle>

        {/* Card preview */}
        <div className="p-8 space-y-6">
          {/* Word */}
          <div className="text-center space-y-1">
            <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
              {word.partOfSpeech}
            </p>
            <h2
              className="text-3xl md:text-4xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {word.word}
            </h2>
            {word.etymology && (
              <p className="text-sm text-muted-foreground italic">{word.etymology}</p>
            )}
          </div>

          {/* Definition */}
          <div className="p-4 rounded-xl bg-secondary/50">
            <p className="text-base leading-relaxed text-foreground">
              {word.definition}
            </p>
          </div>

          {/* Example */}
          <div className="p-4 rounded-xl border border-border">
            <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">
              Przykład
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground italic">
              „{word.example}"
            </p>
          </div>

          {/* Branding */}
          <p className="text-center text-xs text-muted-foreground/60 tracking-wide">
            Eloquencee — ucz się nowych słów każdego dnia
          </p>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Skopiowano!" : "Kopiuj tekst"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNativeShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Share2 size={16} />
            Udostępnij
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
