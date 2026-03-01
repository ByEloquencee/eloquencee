import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT = 3 * 1000; // 3 seconds for testing (change back to 5 * 60 * 1000)

export function SpiderWeb() {
  const [visible, setVisible] = useState(false);
  const [fleeing, setFleeing] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      clearTimeout(timer);
      if (visible) {
        // Trigger flee animation first
        setFleeing(true);
        setTimeout(() => {
          setVisible(false);
          setFleeing(false);
        }, 600);
      }
      timer = setTimeout(() => {
        setFleeing(false);
        setVisible(true);
      }, IDLE_TIMEOUT);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, schedule, { passive: true }));
    timer = setTimeout(() => setVisible(true), IDLE_TIMEOUT);

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, schedule));
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.8 }}
          className="w-full pointer-events-none select-none"
          style={{ marginTop: "-1px" }}
        >
          {/* Web stretched along card width */}
          <motion.svg
            width="100%"
            height="24"
            viewBox="0 0 400 24"
            preserveAspectRatio="none"
            className="opacity-[0.12] w-full"
            style={{ color: "hsl(var(--muted-foreground))" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            transition={{ duration: 0.8 }}
          >
            {/* Threads from card edge converging to right side */}
            <line x1="40" y1="0" x2="310" y2="22" stroke="currentColor" strokeWidth="0.6" />
            <line x1="120" y1="0" x2="310" y2="22" stroke="currentColor" strokeWidth="0.6" />
            <line x1="200" y1="0" x2="310" y2="22" stroke="currentColor" strokeWidth="0.6" />
            <line x1="280" y1="0" x2="310" y2="22" stroke="currentColor" strokeWidth="0.6" />
            <line x1="360" y1="0" x2="310" y2="22" stroke="currentColor" strokeWidth="0.6" />
            {/* Cross threads */}
            <path d="M 100 5 Q 220 10 340 5" stroke="currentColor" strokeWidth="0.4" fill="none" />
            <path d="M 80 12 Q 220 18 350 12" stroke="currentColor" strokeWidth="0.4" fill="none" />
            <path d="M 90 18 Q 220 24 340 18" stroke="currentColor" strokeWidth="0.35" fill="none" />
          </motion.svg>

          {/* Thread + spider, positioned to the right */}
          <div className="flex" style={{ justifyContent: "right", paddingRight: "22%" }}>
            <div className="flex flex-col items-center">
              {/* Thread */}
              <motion.div
                initial={{ height: 0 }}
                animate={fleeing ? { height: 0 } : { height: 44 }}
                transition={fleeing ? { duration: 0.3 } : { duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="w-px overflow-hidden"
                style={{
                  background: "linear-gradient(to bottom, hsl(var(--muted-foreground) / 0.18), hsl(var(--muted-foreground) / 0.06))",
                }}
              />

              {/* Spider */}
              <motion.div
                initial={{ opacity: 0, scale: 0.3, y: -20 }}
                animate={
                  fleeing
                    ? { opacity: 0, y: -60, scale: 0.3, transition: { duration: 0.4, ease: "easeIn" } }
                    : { opacity: 1, scale: 1, y: 0 }
                }
                transition={{ delay: 0.9, duration: 0.4, type: "spring", bounce: 0.5 }}
                className="origin-top"
              >
                <motion.div
                  animate={fleeing ? {} : { rotate: [0, 8, -8, 5, -5, 0] }}
                  transition={{ delay: 1.8, duration: 4, repeat: Infinity, repeatDelay: 3 }}
                  className="origin-top"
                >
                  <motion.svg
                    width="24"
                    height="22"
                    viewBox="0 0 24 22"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {/* Legs left */}
                    <motion.g
                      animate={fleeing ? { rotate: -15 } : { rotate: [0, 5, -5, 0] }}
                      transition={fleeing ? { duration: 0.2 } : { duration: 0.8, repeat: Infinity, repeatDelay: 0.6 }}
                      style={{ transformOrigin: "10px 9px" }}
                    >
                      <path d="M 10 7 Q 5 2 1 0" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                      <path d="M 10 9 Q 3 7 0 5" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                      <path d="M 9 11 Q 4 13 1 17" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                      <path d="M 9 13 Q 5 16 2 20" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    </motion.g>
                    {/* Legs right */}
                    <motion.g
                      animate={fleeing ? { rotate: 15 } : { rotate: [0, -5, 5, 0] }}
                      transition={fleeing ? { duration: 0.2 } : { duration: 0.8, repeat: Infinity, repeatDelay: 0.6, delay: 0.1 }}
                      style={{ transformOrigin: "14px 9px" }}
                    >
                      <path d="M 14 7 Q 19 2 23 0" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                      <path d="M 14 9 Q 21 7 24 5" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                      <path d="M 15 11 Q 20 13 23 17" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                      <path d="M 15 13 Q 19 16 22 20" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                    </motion.g>
                    {/* Head */}
                    <ellipse cx="12" cy="7" rx="3" ry="2.5" fill="currentColor" opacity="0.7" />
                    {/* Abdomen */}
                    <ellipse cx="12" cy="13" rx="4" ry="3.5" fill="currentColor" opacity="0.6" />
                    {/* Eyes */}
                    <circle cx="10.8" cy="6.2" r="0.9" fill="hsl(var(--background))" opacity="0.9" />
                    <circle cx="13.2" cy="6.2" r="0.9" fill="hsl(var(--background))" opacity="0.9" />
                    {/* Pupils */}
                    <motion.circle
                      r="0.45"
                      fill="hsl(var(--foreground))"
                      animate={fleeing ? { cy: 5.8 } : { cx: [10.8, 11.3, 10.3, 10.8], cy: [6.2, 6.5, 6, 6.2] }}
                      transition={fleeing ? { duration: 0.1 } : { duration: 3, repeat: Infinity, repeatDelay: 1.5 }}
                    />
                    <motion.circle
                      r="0.45"
                      fill="hsl(var(--foreground))"
                      animate={fleeing ? { cy: 5.8 } : { cx: [13.2, 13.7, 12.7, 13.2], cy: [6.2, 6.5, 6, 6.2] }}
                      transition={fleeing ? { duration: 0.1 } : { duration: 3, repeat: Infinity, repeatDelay: 1.5 }}
                    />
                  </motion.svg>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
