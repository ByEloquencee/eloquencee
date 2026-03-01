import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function SpiderWeb() {
  const [visible, setVisible] = useState(false);

  const reset = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      clearTimeout(timer);
      setVisible(false);
      timer = setTimeout(() => setVisible(true), IDLE_TIMEOUT);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, schedule, { passive: true }));
    schedule();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, schedule));
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute -top-1 right-8 z-10 pointer-events-none select-none"
          onClick={reset}
        >
          {/* Thread */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 64 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-px mx-auto"
            style={{ background: "linear-gradient(to bottom, hsl(var(--muted-foreground) / 0.3), hsl(var(--muted-foreground) / 0.15))" }}
          />

          {/* Spider body swinging */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: 1,
              y: 0,
              rotate: [0, 6, -6, 4, -4, 2, -2, 0],
            }}
            transition={{
              opacity: { delay: 0.8, duration: 0.5 },
              y: { delay: 0.8, duration: 0.5 },
              rotate: { delay: 1.3, duration: 3, repeat: Infinity, repeatDelay: 4 },
            }}
            className="flex flex-col items-center origin-top"
          >
            {/* Web triangle */}
            <svg width="32" height="20" viewBox="0 0 32 20" className="opacity-20" style={{ color: "hsl(var(--muted-foreground))" }}>
              <line x1="16" y1="0" x2="4" y2="18" stroke="currentColor" strokeWidth="0.5" />
              <line x1="16" y1="0" x2="28" y2="18" stroke="currentColor" strokeWidth="0.5" />
              <line x1="16" y1="0" x2="16" y2="20" stroke="currentColor" strokeWidth="0.5" />
              <path d="M 8 6 Q 16 8 24 6" stroke="currentColor" strokeWidth="0.4" fill="none" />
              <path d="M 6 12 Q 16 15 26 12" stroke="currentColor" strokeWidth="0.4" fill="none" />
            </svg>

            {/* Spider */}
            <svg width="20" height="18" viewBox="0 0 20 18" style={{ color: "hsl(var(--muted-foreground))", marginTop: "-2px" }}>
              {/* Legs left */}
              <path d="M 8 8 Q 3 4 1 2" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              <path d="M 8 9 Q 2 8 0 7" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              <path d="M 8 10 Q 3 12 1 15" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              <path d="M 8 11 Q 4 14 2 17" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              {/* Legs right */}
              <path d="M 12 8 Q 17 4 19 2" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              <path d="M 12 9 Q 18 8 20 7" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              <path d="M 12 10 Q 17 12 19 15" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              <path d="M 12 11 Q 16 14 18 17" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              {/* Body */}
              <ellipse cx="10" cy="7" rx="3" ry="2.5" fill="currentColor" opacity="0.7" />
              <ellipse cx="10" cy="11" rx="3.5" ry="3" fill="currentColor" opacity="0.7" />
              {/* Eyes */}
              <circle cx="9" cy="6" r="0.6" fill="hsl(var(--background))" />
              <circle cx="11" cy="6" r="0.6" fill="hsl(var(--background))" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
