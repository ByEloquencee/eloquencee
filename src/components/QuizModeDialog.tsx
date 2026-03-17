import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { BrainCircuit, Sparkles, Zap, Flame, Crown, MousePointerClick, Keyboard, Replace } from "lucide-react";
import { getFolderIcon } from "@/components/CreateFolderDialog";
import type { Folder } from "@/hooks/use-folders";
import type { DifficultyLevel } from "@/hooks/use-profile";
import type { QuizMode } from "@/components/QuizView";

interface QuizModeDialogProps {
  open: boolean;
  onClose: () => void;
  onStartQuiz: (source: "favorites" | string, mode: QuizMode) => void;
  onStartRandomQuiz: (difficulty: DifficultyLevel, mode: QuizMode) => void;
  onStartSynonymQuiz: (source: "favorites" | string | "__random__", difficulty?: DifficultyLevel) => void;
  hasFavorites: boolean;
  folders: Folder[];
}

const difficultyOptions: { value: DifficultyLevel; label: string; description: string; icon: typeof Zap }[] = [
  { value: "beginner", label: "Łatwy", description: "Podstawowe słownictwo", icon: Zap },
  { value: "intermediate", label: "Średni", description: "Dla średniozaawansowanych", icon: Flame },
  { value: "advanced", label: "Trudny", description: "Wymagające słownictwo", icon: Crown },
];

type Step = "source" | "mode" | "difficulty";

export function QuizModeDialog({ open, onClose, onStartQuiz, onStartRandomQuiz, onStartSynonymQuiz, hasFavorites, folders }: QuizModeDialogProps) {
  const [step, setStep] = useState<Step>("source");
  const [pendingSource, setPendingSource] = useState<string | null>(null);

  const handleClose = () => {
    setStep("source");
    setPendingSource(null);
    onClose();
  };

  const handleSourceSelect = (source: string) => {
    setPendingSource(source);
    setStep("mode");
  };

  const handleModeSelect = (mode: QuizMode) => {
    if (pendingSource === "__random__") {
      setStep("difficulty");
    } else if (pendingSource) {
      onStartQuiz(pendingSource, mode);
      handleClose();
    }
  };

  const handleDifficultySelect = (difficulty: DifficultyLevel, mode: QuizMode) => {
    onStartRandomQuiz(difficulty, mode);
    handleClose();
  };

  const [selectedMode, setSelectedMode] = useState<QuizMode>("multiple-choice");

  const title = step === "source" ? "Sprawdź się" : step === "mode" ? "Tryb quizu" : "Wybierz poziom";
  const desc = step === "source" ? "Wybierz źródło słów do quizu" : step === "mode" ? "Jak chcesz odpowiadać?" : "Wybierz poziom trudności quizu";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl" style={{ fontFamily: "var(--font-display)" }}>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        {step === "mode" && (
          <div className="grid gap-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelectedMode("multiple-choice");
                if (pendingSource === "__random__") {
                  setStep("difficulty");
                } else if (pendingSource) {
                  onStartQuiz(pendingSource, "multiple-choice");
                  handleClose();
                }
              }}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 cursor-pointer"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><MousePointerClick size={22} /></div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Wybór odpowiedzi</p>
                <p className="text-xs text-muted-foreground mt-0.5">Wybierz poprawną odpowiedź z 4 opcji</p>
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelectedMode("typing");
                if (pendingSource === "__random__") {
                  setStep("difficulty");
                } else if (pendingSource) {
                  onStartQuiz(pendingSource, "typing");
                  handleClose();
                }
              }}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 cursor-pointer"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><Keyboard size={22} /></div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Wpisywanie</p>
                <p className="text-xs text-muted-foreground mt-0.5">Wpisz poprawne słowo na podstawie definicji</p>
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (pendingSource === "__random__") {
                  onStartSynonymQuiz("__random__");
                } else if (pendingSource) {
                  onStartSynonymQuiz(pendingSource);
                }
                handleClose();
              }}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 cursor-pointer"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><Replace size={22} /></div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Synonimy</p>
                <p className="text-xs text-muted-foreground mt-0.5">Znajdź synonim podanego słowa</p>
              </div>
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("source")} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1">← Wróć</motion.button>
          </div>
        )}

        {step === "difficulty" && (
          <div className="grid gap-3 pt-2">
            {difficultyOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onStartRandomQuiz(opt.value, selectedMode);
                    handleClose();
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 cursor-pointer"
                >
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><Icon size={22} /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  </div>
                </motion.button>
              );
            })}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("mode")} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1">← Wróć</motion.button>
          </div>
        )}

        {step === "source" && (
          <div className="grid gap-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSourceSelect("__random__")}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 cursor-pointer"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><Sparkles size={22} /></div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Sprawdź się!</p>
                <p className="text-xs text-muted-foreground mt-0.5">8 losowych słów z wybranym poziomem trudności</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { if (hasFavorites) handleSourceSelect("favorites"); }}
              disabled={!hasFavorites}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><BrainCircuit size={22} /></div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Ulubione</p>
                <p className="text-xs text-muted-foreground mt-0.5">{hasFavorites ? "Quiz ze słów dodanych do ulubionych" : "Dodaj min. 4 ulubione słowa"}</p>
              </div>
            </motion.button>

            {folders.map((folder) => {
              const Icon = getFolderIcon(folder.icon);
              const enough = folder.wordIds.length >= 4;
              return (
                <motion.button
                  key={folder.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { if (enough) handleSourceSelect(folder.id); }}
                  disabled={!enough}
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><Icon size={22} /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{folder.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{enough ? `${folder.wordIds.length} słów w folderze` : `Min. 4 słowa (teraz: ${folder.wordIds.length})`}</p>
                  </div>
                </motion.button>
              );
            })}

            {folders.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Utwórz foldery, aby mieć więcej źródeł do quizu</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
