import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Trash2, FolderOpen } from "lucide-react";
import { getFolderIcon } from "@/components/CreateFolderDialog";
import type { Folder } from "@/hooks/use-folders";

interface FolderDropdownProps {
  folders: Folder[];
  activeFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
}

export function FolderDropdown({ folders, activeFolder, onSelectFolder, onDeleteFolder }: FolderDropdownProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (folders.length === 0) return null;

  const activeF = folders.find((f) => f.id === activeFolder);

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setMenuOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
          activeFolder
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
      >
        {activeF ? (
          <>
            {(() => { const Icon = getFolderIcon(activeF.icon); return <Icon size={14} />; })()}
            <span>{activeF.wordIds.length}</span>
          </>
        ) : (
          <>
            <FolderOpen size={14} />
            <ChevronDown size={12} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-full mt-1 z-50 w-48 bg-card rounded-xl border border-border shadow-lg overflow-hidden"
          >
            {activeFolder && (
              <button
                onClick={() => { onSelectFolder(null); setMenuOpen(false); }}
                className="w-full px-3 py-2 text-xs text-muted-foreground hover:bg-secondary transition-colors cursor-pointer text-left"
              >
                Pokaż wszystkie
              </button>
            )}
            {folders.map((f) => {
              const Icon = getFolderIcon(f.icon);
              return (
                <div key={f.id} className="flex items-center group">
                  <button
                    onClick={() => {
                      onSelectFolder(activeFolder === f.id ? null : f.id);
                      setMenuOpen(false);
                      setConfirmDelete(null);
                    }}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer text-left ${
                      activeFolder === f.id ? "bg-secondary font-medium" : "hover:bg-secondary"
                    }`}
                  >
                    <Icon size={14} />
                    <span className="truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{f.wordIds.length}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirmDelete === f.id) {
                        onDeleteFolder(f.id);
                        setConfirmDelete(null);
                        if (activeFolder === f.id) onSelectFolder(null);
                      } else {
                        setConfirmDelete(f.id);
                      }
                    }}
                    className={`p-1.5 mr-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer ${
                      confirmDelete === f.id
                        ? "opacity-100 bg-destructive text-destructive-foreground"
                        : "text-muted-foreground hover:text-destructive"
                    }`}
                    title={confirmDelete === f.id ? "Potwierdź usunięcie" : "Usuń folder"}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
