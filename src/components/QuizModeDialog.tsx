import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { BrainCircuit, Construction } from "lucide-react";

interface QuizModeDialogProps {
  open: boolean;
  onClose: () => void;
  onStartQuiz: () => void;
  hasFavorites: boolean;
}

export function QuizModeDialog({ open, onClose, onStartQuiz, hasFavorites }: QuizModeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
            Sprawdź się
          </DialogTitle>
          <DialogDescription>Wybierz tryb quizu</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (!hasFavorites) return;
              onStartQuiz();
            }}
            disabled={!hasFavorites}
            className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <BrainCircuit size={22} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Quiz z ulubionych</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasFavorites
                  ? "Definicja → wybierz poprawne słowo"
                  : "Dodaj ulubione słowa, aby odblokować"}
              </p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled
            className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left opacity-50 cursor-not-allowed"
          >
            <div className="p-2.5 rounded-lg bg-muted text-muted-foreground">
              <Construction size={22} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Trwają prace</p>
              <p className="text-xs text-muted-foreground mt-0.5">Wkrótce dostępne</p>
            </div>
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
