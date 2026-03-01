import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT = 3 * 1000; // 3 seconds for testing (change back to 5 * 60 * 1000)

export function SpiderWeb() {
  const [visible, setVisible] = useState(false);

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
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 1 }}
          className="w-full flex justify-center pointer-events-none select-none"
          style={{ marginTop: "-1px" }}
        >
          <div className="relative flex flex-col items-center">
            {/* Web anchored to card bottom */}
            <motion.svg
              width="120"
              height="60"
              viewBox="0 0 120 60"
              className="opacity-[0.15]"
              style={{ color: "hsl(var(--muted-foreground))" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ duration: 1 }}
            >
              {/* Anchor points along card bottom edge */}
              <line x1="20" y1="0" x2="60" y2="58" stroke="currentColor" strokeWidth="0.6" />
              <line x1="40" y1="0" x2="60" y2="58" stroke="currentColor" strokeWidth="0.6" />
              <line x1="60" y1="0" x2="60" y2="58" stroke="currentColor" strokeWidth="0.6" />
              <line x1="80" y1="0" x2="60" y2="58" stroke="currentColor" strokeWidth="0.6" />
              <line x1="100" y1="0" x2="60" y2="58" stroke="currentColor" strokeWidth="0.6" />
              {/* Concentric arcs */}
              <path d="M 35 12 Q 60 20 85 12" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <path d="M 30 24 Q 60 34 90 24" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <path d="M 28 36 Q 60 48 92 36" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <path d="M 32 48 Q 60 58 88 48" stroke="currentColor" strokeWidth="0.4" fill="none" />
            </motion.svg>

            {/* Single thread going further down */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 50 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
              className="w-px overflow-hidden"
              style={{
                background: "linear-gradient(to bottom, hsl(var(--muted-foreground) / 0.2), hsl(var(--muted-foreground) / 0.08))",
              }}
            />

            {/* Spider */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.5, type: "spring", bounce: 0.5 }}
              className="origin-top"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 6, -6, 0] }}
                transition={{ delay: 2, duration: 5, repeat: Infinity, repeatDelay: 3 }}
                className="origin-top"
              >
                <motion.svg
                  width="28"
                  height="26"
                  viewBox="0 0 28 26"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {/* Legs left */}
                  <motion.g
                    animate={{ rotate: [0, 4, -4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
                    style={{ transformOrigin: "12px 11px" }}
                  >
                    <path d="M 12 8 Q 6 3 2 0" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    <path d="M 12 10 Q 4 8 0 6" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    <path d="M 11 13 Q 5 15 1 20" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    <path d="M 11 15 Q 6 19 3 24" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                  </motion.g>
                  {/* Legs right */}
                  <motion.g
                    animate={{ rotate: [0, -4, 4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8, delay: 0.15 }}
                    style={{ transformOrigin: "16px 11px" }}
                  >
                    <path d="M 16 8 Q 22 3 26 0" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    <path d="M 16 10 Q 24 8 28 6" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    <path d="M 17 13 Q 23 15 27 20" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    <path d="M 17 15 Q 22 19 25 24" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                  </motion.g>
                  {/* Head */}
                  <ellipse cx="14" cy="8" rx="3.5" ry="3" fill="currentColor" opacity="0.7" />
                  {/* Abdomen */}
                  <ellipse cx="14" cy="15" rx="5" ry="4.5" fill="currentColor" opacity="0.65" />
                  {/* Pattern on abdomen */}
                  <ellipse cx="14" cy="14" rx="2" ry="1.5" fill="hsl(var(--background))" opacity="0.15" />
                  {/* Eyes */}
                  <circle cx="12.5" cy="7.2" r="1" fill="hsl(var(--background))" opacity="0.9" />
                  <circle cx="15.5" cy="7.2" r="1" fill="hsl(var(--background))" opacity="0.9" />
                  {/* Pupils that look around */}
                  <motion.circle
                    r="0.5"
                    fill="hsl(var(--foreground))"
                    animate={{ cx: [12.5, 13, 12, 12.5], cy: [7.2, 7.5, 7, 7.2] }}
                    transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 1.5 }}
                  />
                  <motion.circle
                    r="0.5"
                    fill="hsl(var(--foreground))"
                    animate={{ cx: [15.5, 16, 15, 15.5], cy: [7.2, 7.5, 7, 7.2] }}
                    transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 1.5 }}
                  />
                </motion.svg>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
