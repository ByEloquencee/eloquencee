import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import {
  Bookmark, Star, Flame, Zap, Target, Crown, Gem, Rocket,
  BookOpen, Brain, Sparkles, Flag, Award, Coffee, Music,
  Palette, Globe, Compass, Anchor, Feather
} from "lucide-react";

const FOLDER_ICONS = [
  { name: "bookmark", Icon: Bookmark },
  { name: "star", Icon: Star },
  { name: "flame", Icon: Flame },
  { name: "zap", Icon: Zap },
  { name: "target", Icon: Target },
  { name: "crown", Icon: Crown },
  { name: "gem", Icon: Gem },
  { name: "rocket", Icon: Rocket },
  { name: "book-open", Icon: BookOpen },
  { name: "brain", Icon: Brain },
  { name: "sparkles", Icon: Sparkles },
  { name: "flag", Icon: Flag },
  { name: "award", Icon: Award },
  { name: "coffee", Icon: Coffee },
  { name: "music", Icon: Music },
  { name: "palette", Icon: Palette },
  { name: "globe", Icon: Globe },
  { name: "compass", Icon: Compass },
  { name: "anchor", Icon: Anchor },
  { name: "feather", Icon: Feather },
] as const;

export type FolderIconName = typeof FOLDER_ICONS[number]["name"];

export function getFolderIcon(name: string) {
  return FOLDER_ICONS.find((i) => i.name === name)?.Icon || Bookmark;
}

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string, icon: string) => Promise<void>;
}

export function CreateFolderDialog({ open, onClose, onCreated }: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("bookmark");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreated(name.trim(), selectedIcon);
      setName("");
      setSelectedIcon("bookmark");
      onClose();
    } catch {
      // error handled upstream
    } finally {
      setSubmitting(false);
    }
  };

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
          className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Nowy folder
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <input
              type="text"
              placeholder="Nazwa folderu *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Wybierz ikonkę</p>
              <div className="grid grid-cols-5 gap-2">
                {FOLDER_ICONS.map(({ name: iconName, Icon }) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setSelectedIcon(iconName)}
                    className={`relative p-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                      selectedIcon === iconName
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Icon size={18} />
                    {selectedIcon === iconName && (
                      <Check size={10} className="absolute top-1 right-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Tworzenie..." : "Stwórz folder"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
