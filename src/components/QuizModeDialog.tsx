import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { BrainCircuit, Sparkles, Zap, Flame, Crown } from "lucide-react";
import { getFolderIcon } from "@/components/CreateFolderDialog";
import type { Folder } from "@/hooks/use-folders";
import type { DifficultyLevel } from "@/hooks/use-profile";

interface QuizModeDialogProps {
  open: boolean;
  onClose: () => void;
  onStartQuiz: (source: "favorites" | string) => void;
  onStartRandomQuiz: (difficulty: DifficultyLevel) => void;
  hasFavorites: boolean;
  folders: Folder[];
}

const difficultyOptions: { value: DifficultyLevel; label: string; description: string; icon: typeof Zap }[] = [
  { value: "beginner", label: "Łatwy", description: "Podstawowe słownictwo", icon: Zap },
  { value: "intermediate", label: "Średni", description: "Dla średniozaawansowanych", icon: Flame },
  { value: "advanced", label: "Trudny", description: "Wymagające słownictwo", icon: Crown },
];

export function QuizModeDialog({ open, onClose, onStartQuiz, onStartRandomQuiz, hasFavorites, folders }: QuizModeDialogProps) {
  const [showDifficulty, setShowDifficulty] = useState(false);

  const handleClose = () => {
    setShowDifficulty(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
            {showDifficulty ? "Wybierz poziom" : "Sprawdź się"}
          </DialogTitle>
          <DialogDescription>
            {showDifficulty ? "Wybierz poziom trudności quizu" : "Wybierz źródło słów do quizu"}
          </DialogDescription>
        </DialogHeader>

        {showDifficulty ? (
          <div className="grid gap-3 pt-2">
            {difficultyOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowDifficulty(false);
                    onStartRandomQuiz(opt.value);
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 cursor-pointer"
                >
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <Icon size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  </div>
                </motion.button>
              );
            })}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowDifficulty(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
            >
              ← Wróć
            </motion.button>
          </div>
        ) : (
          <div className="grid gap-3 pt-2">
            {/* Random 8-word quiz */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowDifficulty(true)}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 cursor-pointer"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles size={22} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Sprawdź się!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  8 losowych słów z wybranym poziomem trudności
                </p>
              </div>
            </motion.button>

            {/* Favorites */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (!hasFavorites) return;
                onStartQuiz("favorites");
              }}
              disabled={!hasFavorites}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <BrainCircuit size={22} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Ulubione</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasFavorites
                    ? "Quiz ze słów dodanych do ulubionych"
                    : "Dodaj min. 4 ulubione słowa"}
                </p>
              </div>
            </motion.button>

            {/* Folders */}
            {folders.map((folder) => {
              const Icon = getFolderIcon(folder.icon);
              const enough = folder.wordIds.length >= 4;
              return (
                <motion.button
                  key={folder.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!enough) return;
                    onStartQuiz(folder.id);
                  }}
                  disabled={!enough}
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <Icon size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{folder.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {enough
                        ? `${folder.wordIds.length} słów w folderze`
                        : `Min. 4 słowa (teraz: ${folder.wordIds.length})`}
                    </p>
                  </div>
                </motion.button>
              );
            })}

            {folders.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Utwórz foldery, aby mieć więcej źródeł do quizu
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
