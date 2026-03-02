import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import { getFolderIcon } from "@/components/CreateFolderDialog";
import type { Folder } from "@/hooks/use-folders";

interface QuizModeDialogProps {
  open: boolean;
  onClose: () => void;
  onStartQuiz: (source: "favorites" | string) => void;
  hasFavorites: boolean;
  folders: Folder[];
}

export function QuizModeDialog({ open, onClose, onStartQuiz, hasFavorites, folders }: QuizModeDialogProps) {
  const eligibleFolders = folders.filter((f) => f.wordIds.length >= 4);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
            Sprawdź się
          </DialogTitle>
          <DialogDescription>Wybierz źródło słów do quizu</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
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
      </DialogContent>
    </Dialog>
  );
}
