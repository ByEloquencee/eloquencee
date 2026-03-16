import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT = 15 * 1000; // 15 seconds

export function SpiderWeb() {
  const [visible, setVisible] = useState(false);
  const [fleeing, setFleeing] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      clearTimeout(timer);
      if (visible) {
        setFleeing(true);
        setTimeout(() => {
          setVisible(false);
          setFleeing(false);
        }, 500);
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
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.8 }}
          className="w-full pointer-events-none select-none"
          style={{ marginTop: "-1px" }}
        >
          {/* Cartoon web stretched along card bottom */}
          <motion.svg
            width="100%"
            height="20"
            viewBox="0 0 400 20"
            preserveAspectRatio="none"
            className="w-full opacity-[0.18]"
            style={{ color: "hsl(var(--muted-foreground))" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main radial threads converging to spider position (right side) */}
            <path d="M 30 0 Q 200 8 300 18" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M 100 0 Q 220 6 300 18" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M 180 0 Q 250 8 300 18" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
            <path d="M 260 0 Q 280 6 300 18" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M 350 0 Q 320 6 300 18" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* Cross arcs — cartoon rounded style */}
            <path d="M 60 4 Q 180 12 320 6" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <path d="M 80 10 Q 200 18 330 12" stroke="currentColor" strokeWidth="0.7" fill="none" strokeLinecap="round" />
          </motion.svg>

          {/* Thread + spider on right side */}
          <div className="flex" style={{ justifyContent: "right", paddingRight: "20%" }}>
            <div className="flex flex-col items-center">
              {/* Thread */}
              <motion.div
                initial={{ height: 0 }}
                animate={fleeing ? { height: 0 } : { height: 36 }}
                transition={fleeing ? { duration: 0.25 } : { duration: 0.7, ease: "easeOut", delay: 0.2 }}
                className="overflow-hidden"
                style={{
                  width: "1.5px",
                  background: "linear-gradient(to bottom, hsl(var(--muted-foreground) / 0.2), hsl(var(--muted-foreground) / 0.08))",
                  borderRadius: "1px",
                }}
              />

              {/* Spider — cartoonish */}
              <motion.div
                initial={{ opacity: 0, scale: 0.2, y: -16 }}
                animate={
                  fleeing
                    ? { opacity: 0, y: -50, scale: 0.2, transition: { duration: 0.35, ease: "easeIn" } }
                    : { opacity: 1, scale: 1, y: 0 }
                }
                transition={{ delay: 0.7, duration: 0.4, type: "spring", bounce: 0.6 }}
                className="origin-top"
              >
                <motion.div
                  animate={fleeing ? {} : { rotate: [0, 12, -12, 8, -8, 0] }}
                  transition={{ delay: 1.5, duration: 3.5, repeat: Infinity, repeatDelay: 2.5 }}
                  className="origin-top"
                >
                  <motion.svg
                    width="30"
                    height="28"
                    viewBox="0 0 30 28"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {/* === CARTOON LEGS — thick, rounded, bouncy === */}
                    {/* Left legs */}
                    <motion.g
                      animate={fleeing ? { rotate: -20 } : { rotate: [0, 6, -6, 0] }}
                      transition={fleeing ? { duration: 0.15 } : { duration: 0.7, repeat: Infinity, repeatDelay: 0.5 }}
                      style={{ transformOrigin: "13px 12px" }}
                    >
                      <path d="M 12 9 Q 7 4 3 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 12 11 Q 5 9 1 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 11 14 Q 5 16 2 20" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 11 16 Q 6 19 3 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.g>
                    {/* Right legs */}
                    <motion.g
                      animate={fleeing ? { rotate: 20 } : { rotate: [0, -6, 6, 0] }}
                      transition={fleeing ? { duration: 0.15 } : { duration: 0.7, repeat: Infinity, repeatDelay: 0.5, delay: 0.12 }}
                      style={{ transformOrigin: "17px 12px" }}
                    >
                      <path d="M 18 9 Q 23 4 27 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 18 11 Q 25 9 29 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 19 14 Q 25 16 28 20" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 19 16 Q 24 19 27 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.g>

                    {/* Head — big round cartoon head */}
                    <circle cx="15" cy="9" r="5" fill="currentColor" opacity="0.75" />
                    {/* Abdomen — chubby */}
                    <ellipse cx="15" cy="18" rx="6" ry="5.5" fill="currentColor" opacity="0.6" />
                    {/* Belly highlight */}
                    <ellipse cx="15" cy="17" rx="2.5" ry="2" fill="hsl(var(--background))" opacity="0.1" />

                    {/* Big cartoon eyes */}
                    <circle cx="12.5" cy="8" r="2.2" fill="hsl(var(--background))" />
                    <circle cx="17.5" cy="8" r="2.2" fill="hsl(var(--background))" />
                    {/* Pupils — looking around */}
                    <motion.circle
                      r="1.1"
                      fill="hsl(var(--foreground))"
                      animate={fleeing
                        ? { cx: 12.5, cy: 6.5 }
                        : { cx: [12.5, 13.2, 11.8, 12.5], cy: [8, 8.5, 7.8, 8] }
                      }
                      transition={fleeing ? { duration: 0.1 } : { duration: 3, repeat: Infinity, repeatDelay: 1.2 }}
                    />
                    <motion.circle
                      r="1.1"
                      fill="hsl(var(--foreground))"
                      animate={fleeing
                        ? { cx: 17.5, cy: 6.5 }
                        : { cx: [17.5, 18.2, 16.8, 17.5], cy: [8, 8.5, 7.8, 8] }
                      }
                      transition={fleeing ? { duration: 0.1 } : { duration: 3, repeat: Infinity, repeatDelay: 1.2 }}
                    />
                    {/* Eye shine */}
                    <circle cx="11.8" cy="7" r="0.5" fill="hsl(var(--background))" opacity="0.7" />
                    <circle cx="16.8" cy="7" r="0.5" fill="hsl(var(--background))" opacity="0.7" />

                    {/* Little smile */}
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
