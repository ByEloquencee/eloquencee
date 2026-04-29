import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { BrainCircuit, Sparkles, Zap, Flame, Crown, MousePointerClick, Keyboard, Replace, Heart, Check, Scale } from "lucide-react";
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
  onStartAntonymQuiz: (source: "favorites" | string | "__random__", difficulty?: DifficultyLevel) => void;
  hasFavorites: boolean;
  folders: Folder[];
}

const difficultyOptions: { value: DifficultyLevel; label: string; description: string; icon: typeof Zap }[] = [
  { value: "beginner", label: "Łatwy", description: "Podstawowe słownictwo", icon: Zap },
  { value: "intermediate", label: "Średni", description: "Dla średniozaawansowanych", icon: Flame },
  { value: "advanced", label: "Trudny", description: "Wymagające słownictwo", icon: Crown },
];

type Step = "source" | "packs" | "mode" | "difficulty";

export function QuizModeDialog({ open, onClose, onStartQuiz, onStartRandomQuiz, onStartSynonymQuiz, onStartAntonymQuiz, hasFavorites, folders }: QuizModeDialogProps) {
  const [step, setStep] = useState<Step>("source");
  const [pendingSource, setPendingSource] = useState<string | null>(null);
  const [selectedPacks, setSelectedPacks] = useState<Set<string>>(new Set());
  const [selectedMode, setSelectedMode] = useState<QuizMode>("multiple-choice");

  const handleClose = () => {
    setStep("source");
    setPendingSource(null);
    setSelectedPacks(new Set());
    onClose();
  };

  const handleSourceSelect = (source: string) => {
    setPendingSource(source);
    setStep("mode");
  };

  const togglePack = (id: string) => {
    setSelectedPacks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmPacks = () => {
    if (selectedPacks.size === 0) return;
    const ids = Array.from(selectedPacks);
    const source = ids.length === 1 ? ids[0] : `multi:${ids.join(",")}`;
    setPendingSource(source);
    setStep("mode");
  };

  const startWithMode = (mode: QuizMode) => {
    setSelectedMode(mode);
    if (pendingSource === "__random__") {
      setStep("difficulty");
    } else if (pendingSource) {
      onStartQuiz(pendingSource, mode);
      handleClose();
    }
  };

  const startSynonym = () => {
    if (pendingSource === "__random__") {
      onStartSynonymQuiz("__random__");
    } else if (pendingSource) {
      onStartSynonymQuiz(pendingSource);
    }
    handleClose();
  };

  const startAntonym = () => {
    if (pendingSource === "__random__") {
      onStartAntonymQuiz("__random__");
    } else if (pendingSource) {
      onStartAntonymQuiz(pendingSource);
    }
    handleClose();
  };

  const availablePacks: { id: string; name: string; icon: typeof Heart; count: number; enough: boolean }[] = [
    ...(hasFavorites ? [{ id: "favorites", name: "Ulubione", icon: Heart, count: 0, enough: true }] : []),
    ...folders.map((f) => ({
      id: f.id,
      name: f.name,
      icon: getFolderIcon(f.icon),
      count: f.wordIds.length,
      enough: f.wordIds.length >= 1,
    })),
  ];

  const title =
    step === "source" ? "Sprawdź się"
    : step === "packs" ? "Wybierz paczki"
    : step === "mode" ? "Tryb quizu"
    : "Wybierz poziom";
  const desc =
    step === "source" ? "Wybierz źródło słów do quizu"
    : step === "packs" ? "Zaznacz jedną lub kilka paczek"
    : step === "mode" ? "Jak chcesz odpowiadać?"
    : "Wybierz poziom trudności quizu";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl" style={{ fontFamily: "var(--font-display)" }}>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

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
              onClick={() => {
                if (!hasFavorites && folders.length === 0) return;
                setSelectedPacks(new Set());
                setStep("packs");
              }}
              disabled={!hasFavorites && folders.length === 0}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><BrainCircuit size={22} /></div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Ulubione</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasFavorites || folders.length > 0
                    ? "Quiz ze słów z ulubionych i Twoich folderów"
                    : "Dodaj słowa do ulubionych lub utwórz folder"}
                </p>
              </div>
            </motion.button>
          </div>
        )}

        {step === "packs" && (
          <div className="grid gap-2 pt-2">
            <div className="max-h-[50vh] overflow-y-auto grid gap-2 pr-1 scrollbar-none">
              {availablePacks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Brak dostępnych paczek</p>
              )}
              {availablePacks.map((pack) => {
                const Icon = pack.icon;
                const selected = selectedPacks.has(pack.id);
                return (
                  <motion.button
                    key={pack.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => pack.enough && togglePack(pack.id)}
                    disabled={!pack.enough}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                      selected ? "bg-primary/15 ring-1 ring-primary/40" : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                      {selected ? <Check size={18} /> : <Icon size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{pack.name}</p>
                      {pack.id !== "favorites" && (
                        <p className="text-xs text-muted-foreground mt-0.5">{pack.count} słów</p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("source")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
              >
                ← Wróć
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={confirmPacks}
                disabled={selectedPacks.size === 0}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Dalej {selectedPacks.size > 0 && `(${selectedPacks.size})`}
              </motion.button>
            </div>
          </div>
        )}

        {step === "mode" && (
          <div className="grid gap-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => startWithMode("multiple-choice")}
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
              onClick={() => startWithMode("typing")}
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
              onClick={startSynonym}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 cursor-pointer"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><Replace size={22} /></div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Synonimy</p>
                <p className="text-xs text-muted-foreground mt-0.5">Znajdź synonim podanego słowa</p>
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={startAntonym}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary text-left transition-colors hover:bg-secondary/80 cursor-pointer"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><Scale size={22} /></div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Antonimy</p>
                <p className="text-xs text-muted-foreground mt-0.5">Wybierz przeciwieństwo na podstawie definicji</p>
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep(pendingSource === "__random__" ? "source" : "packs")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
            >
              ← Wróć
            </motion.button>
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
      </DialogContent>
    </Dialog>
  );
}
