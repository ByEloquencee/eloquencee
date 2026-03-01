import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT = 3 * 1000; // 3 seconds for testing (change back to 5 * 60 * 1000)

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
          className="absolute -bottom-2 left-10 z-10 pointer-events-none select-none"
          onClick={reset}
        >
          {/* Web structure attached to bottom of card */}
          <svg width="48" height="40" viewBox="0 0 48 40" className="opacity-25" style={{ color: "hsl(var(--muted-foreground))" }}>
            {/* Radial threads */}
            <line x1="24" y1="0" x2="2" y2="38" stroke="currentColor" strokeWidth="0.5" />
            <line x1="24" y1="0" x2="14" y2="40" stroke="currentColor" strokeWidth="0.5" />
            <line x1="24" y1="0" x2="24" y2="40" stroke="currentColor" strokeWidth="0.5" />
            <line x1="24" y1="0" x2="34" y2="40" stroke="currentColor" strokeWidth="0.5" />
            <line x1="24" y1="0" x2="46" y2="38" stroke="currentColor" strokeWidth="0.5" />
            {/* Cross threads */}
            <path d="M 10 10 Q 24 14 38 10" stroke="currentColor" strokeWidth="0.4" fill="none" />
            <path d="M 6 20 Q 24 25 42 20" stroke="currentColor" strokeWidth="0.4" fill="none" />
            <path d="M 4 30 Q 24 36 44 30" stroke="currentColor" strokeWidth="0.4" fill="none" />
          </svg>

          {/* Thread down to spider */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 80 }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
            className="w-px mx-auto overflow-hidden"
            style={{ background: "linear-gradient(to bottom, hsl(var(--muted-foreground) / 0.25), hsl(var(--muted-foreground) / 0.1))" }}
          />

          {/* Spider swinging */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              opacity: { delay: 1.2, duration: 0.6 },
              y: { delay: 1.2, duration: 0.6, type: "spring", bounce: 0.4 },
            }}
            className="flex flex-col items-center origin-top"
          >
            <motion.div
              animate={{
                rotate: [0, 8, -8, 5, -5, 3, -3, 0],
              }}
              transition={{
                rotate: { delay: 2, duration: 4, repeat: Infinity, repeatDelay: 2 },
              }}
              className="origin-top"
            >
              {/* Spider SVG */}
              <motion.svg
                width="26"
                height="24"
                viewBox="0 0 26 24"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {/* Legs left - animated */}
                <motion.g
                  animate={{ rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  style={{ transformOrigin: "10px 10px" }}
                >
                  <path d="M 10 8 Q 5 3 2 1" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                  <path d="M 10 10 Q 3 8 0 6" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                  <path d="M 10 12 Q 4 14 1 18" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                  <path d="M 10 13 Q 5 17 3 22" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                </motion.g>
                {/* Legs right - animated opposite */}
                <motion.g
                  animate={{ rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, delay: 0.2 }}
                  style={{ transformOrigin: "16px 10px" }}
                >
                  <path d="M 16 8 Q 21 3 24 1" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                  <path d="M 16 10 Q 23 8 26 6" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                  <path d="M 16 12 Q 22 14 25 18" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                  <path d="M 16 13 Q 21 17 23 22" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                </motion.g>
                {/* Body */}
                <ellipse cx="13" cy="8" rx="3.5" ry="3" fill="currentColor" opacity="0.75" />
                <ellipse cx="13" cy="14" rx="4.5" ry="4" fill="currentColor" opacity="0.75" />
                {/* Eyes */}
                <circle cx="11.5" cy="7" r="0.8" fill="hsl(var(--background))" />
                <circle cx="14.5" cy="7" r="0.8" fill="hsl(var(--background))" />
                {/* Pupils */}
                <motion.circle
                  cx="11.5" cy="7" r="0.4"
                  fill="hsl(var(--foreground))"
                  animate={{ cx: [11.5, 12, 11, 11.5] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
                <motion.circle
                  cx="14.5" cy="7" r="0.4"
                  fill="hsl(var(--foreground))"
                  animate={{ cx: [14.5, 15, 14, 14.5] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
              </motion.svg>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
