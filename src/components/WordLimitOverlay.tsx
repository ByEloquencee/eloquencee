import { motion, AnimatePresence } from "framer-motion";
import { Crown, Infinity, GraduationCap, Sparkles, Zap } from "lucide-react";

interface WordLimitOverlayProps {
  show: boolean;
  onUpgrade: () => void;
}

const PERKS = [
  { icon: Infinity, text: "Bez limitu słów dziennie" },
  { icon: GraduationCap, text: "Quizy i ćwiczenia bez ograniczeń" },
  { icon: Sparkles, text: "AI Chat do nauki słów" },
];

export function WordLimitOverlay({ show, onUpgrade }: WordLimitOverlayProps) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 backdrop-blur-md rounded-2xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="text-center space-y-5 p-6 max-w-xs"
        >
          {/* Animated crown */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
          >
            <Crown size={36} className="text-primary" />
          </motion.div>

          <div className="space-y-1.5">
            <h3
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Chcesz więcej? 🚀
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Przejrzałeś już <strong className="text-foreground">10 słów</strong> dzisiaj.
              Wskocz na Premium i ucz się bez ograniczeń!
            </p>
          </div>

          {/* Perks list */}
          <div className="space-y-2 text-left">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-primary" />
                </div>
                <span className="text-foreground">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onUpgrade}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-lg"
          >
            <Zap size={16} />
            Wskocz na Premium — 5,99 zł/mies.
          </motion.button>

          <p className="text-[10px] text-muted-foreground">
            Możesz anulować w dowolnym momencie
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
