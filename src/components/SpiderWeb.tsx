import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT = 15 * 1000;

export function SpiderWeb() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), IDLE_TIMEOUT);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(hideTimer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none select-none absolute left-3 top-full z-10"
        >
          <div className="flex flex-col items-center">
            {/* Single thread */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 40 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{
                width: "1.5px",
                background: "linear-gradient(to bottom, hsl(var(--muted-foreground) / 0.25), hsl(var(--muted-foreground) / 0.08))",
                borderRadius: "1px",
              }}
            />

            {/* Spider */}
            <motion.div
              initial={{ opacity: 0, scale: 0.2, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4, type: "spring", bounce: 0.6 }}
              className="origin-top"
            >
              <motion.div
                animate={{ rotate: [0, 12, -12, 8, -8, 0] }}
                transition={{ delay: 1.5, duration: 3.5, repeat: Infinity, repeatDelay: 2.5 }}
                className="origin-top"
              >
                <motion.svg
                  width="30"
                  height="28"
                  viewBox="0 0 30 28"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {/* Left legs */}
                  <motion.g
                    animate={{ rotate: [0, 6, -6, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.5 }}
                    style={{ transformOrigin: "13px 12px" }}
                  >
                    <path d="M 12 9 Q 7 4 3 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 12 11 Q 5 9 1 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 11 14 Q 5 16 2 20" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 11 16 Q 6 19 3 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.g>
                  {/* Right legs */}
                  <motion.g
                    animate={{ rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.5, delay: 0.12 }}
                    style={{ transformOrigin: "17px 12px" }}
                  >
                    <path d="M 18 9 Q 23 4 27 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 18 11 Q 25 9 29 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 19 14 Q 25 16 28 20" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 19 16 Q 24 19 27 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.g>

                  <circle cx="15" cy="9" r="5" fill="currentColor" opacity="0.75" />
                  <ellipse cx="15" cy="18" rx="6" ry="5.5" fill="currentColor" opacity="0.6" />
                  <ellipse cx="15" cy="17" rx="2.5" ry="2" fill="hsl(var(--background))" opacity="0.1" />

                  <circle cx="12.5" cy="8" r="2.2" fill="hsl(var(--background))" />
                  <circle cx="17.5" cy="8" r="2.2" fill="hsl(var(--background))" />
                  <motion.circle
                    r="1.1"
                    fill="hsl(var(--foreground))"
                    animate={{ cx: [12.5, 13.2, 11.8, 12.5], cy: [8, 8.5, 7.8, 8] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.2 }}
                  />
                  <motion.circle
                    r="1.1"
                    fill="hsl(var(--foreground))"
                    animate={{ cx: [17.5, 18.2, 16.8, 17.5], cy: [8, 8.5, 7.8, 8] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.2 }}
                  />
                  <circle cx="11.8" cy="7" r="0.5" fill="hsl(var(--background))" opacity="0.7" />
                  <circle cx="16.8" cy="7" r="0.5" fill="hsl(var(--background))" opacity="0.7" />

                  <motion.path
                    d="M 13.5 11 Q 15 12.5 16.5 11"
                    stroke="hsl(var(--background))"
                    strokeWidth="0.8"
                    fill="none"
                    strokeLinecap="round"
                    animate={{ d: ["M 13.5 11 Q 15 12.5 16.5 11", "M 13.5 11 Q 15 13 16.5 11", "M 13.5 11 Q 15 12.5 16.5 11"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
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
