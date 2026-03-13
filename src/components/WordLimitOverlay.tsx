import { motion, AnimatePresence } from "framer-motion";
import { Lock, Crown } from "lucide-react";

interface WordLimitOverlayProps {
  show: boolean;
  onUpgrade: () => void;
}

export function WordLimitOverlay({ show, onUpgrade }: WordLimitOverlayProps) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl"
      >
        <div className="text-center space-y-4 p-6 max-w-xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Lock size={28} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Limit dzienny osiągnięty
          </h3>
          <p className="text-sm text-muted-foreground">
            Przejrzałeś już <strong>15 słów</strong> dzisiaj. Przejdź na Premium, aby uczyć się bez ograniczeń!
          </p>
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Crown size={16} />
            Przejdź na Premium
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
