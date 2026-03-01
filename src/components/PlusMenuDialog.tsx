import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, FolderPlus } from "lucide-react";

interface PlusMenuDialogProps {
  open: boolean;
  onClose: () => void;
  onAddWord: () => void;
  onCreateFolder: () => void;
}

export function PlusMenuDialog({ open, onClose, onAddWord, onCreateFolder }: PlusMenuDialogProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xs bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Co chcesz dodać?
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>
          <div className="p-3 space-y-1">
            <button
              onClick={() => { onClose(); onAddWord(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer text-left"
            >
              <FileText size={20} className="text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Nowe słowo</p>
                <p className="text-xs text-muted-foreground">Dodaj własne słowo do nauki</p>
              </div>
            </button>
            <button
              onClick={() => { onClose(); onCreateFolder(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer text-left"
            >
              <FolderPlus size={20} className="text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Nowy folder</p>
                <p className="text-xs text-muted-foreground">Stwórz kolekcję do organizacji słów</p>
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
