import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT = 15 * 1000;

interface SpiderWebProps {
  todayCount?: number;
  dailyGoal?: number;
  streak?: number;
  forceShow?: boolean;
  onHide?: () => void;
}

const MESSAGES_QUIZ = [
  "Sprawdź się w quizie! 🧠",
  "Czas na quiz! Ile zapamiętałeś?",
  "Wypróbuj tryb quizu! 💪",
];

const MESSAGES_KNOWLEDGE = [
  "Ile słów już znasz? Sprawdź się!",
  "Przetestuj swoją wiedzę! 📚",
  "Powtórka czyni mistrza! 🎯",
];

const MESSAGES_NOTIFICATIONS = [
  "Włącz powiadomienia i ucz się codziennie! 🔔",
  "Nowe słówka czekają — włącz przypomnienia!",
];

function getProgressMessages(todayCount: number, dailyGoal: number, streak: number): string[] {
  const msgs: string[] = [];
  if (todayCount === 0) {
    msgs.push("Zacznij dzień od nowego słówka! ☀️");
  } else if (todayCount < dailyGoal) {
    const left = dailyGoal - todayCount;
    msgs.push(`Jeszcze ${left} ${left === 1 ? "słówko" : left < 5 ? "słówka" : "słówek"} do celu! 🎯`);
  } else {
    msgs.push("Cel dzienny osiągnięty! Brawo! 🏆");
  }
  if (streak >= 3) {
    msgs.push(`Passa ${streak} dni! Tak trzymaj! 🔥`);
  }
  if (todayCount >= 5) {
    msgs.push(`Już ${todayCount} słów dziś — super tempo! 🚀`);
  }
  return msgs;
}

function SpiderSVG() {
  return (
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
  );
}

export function SpiderWeb({ todayCount = 0, dailyGoal = 5, streak = 0, forceShow = false, onHide }: SpiderWebProps) {
  const [visible, setVisible] = useState(false);

  const message = useMemo(() => {
    const all = [
      ...MESSAGES_QUIZ,
      ...MESSAGES_KNOWLEDGE,
      ...MESSAGES_NOTIFICATIONS,
      ...getProgressMessages(todayCount, dailyGoal, streak),
    ];
    return all[Math.floor(Math.random() * all.length)];
  }, [todayCount, dailyGoal, streak, visible, forceShow]);

  // Idle timer show
  useEffect(() => {
    if (forceShow) return;
    const showTimer = setTimeout(() => setVisible(true), IDLE_TIMEOUT);
    return () => clearTimeout(showTimer);
  }, [forceShow]);

  // Force show from parent
  useEffect(() => {
    if (forceShow) {
      setVisible(true);
    }
  }, [forceShow]);

  // Auto-hide after 8s
  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => {
      setVisible(false);
      onHide?.();
    }, 8000);
    return () => clearTimeout(hideTimer);
  }, [visible, onHide]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none select-none absolute left-1/2 -translate-x-[15px] top-full z-10"
        >
          <div className="flex flex-col items-center">
            {/* Thread - centered on spider */}
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

            {/* Spider with bubble positioned to the right */}
            <div className="relative">
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
                  <SpiderSVG />
                </motion.div>
              </motion.div>

              {/* Speech bubble - positioned absolutely to the right of spider */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 1.0, duration: 0.4, type: "spring", bounce: 0.4 }}
                className="absolute top-0 left-full ml-2.5"
                style={{ minWidth: 160, maxWidth: 220 }}
              >
                {/* Bubble tail */}
                <div
                  className="absolute left-0 top-3 -translate-x-[5px] w-0 h-0"
                  style={{
                    borderTop: "5px solid transparent",
                    borderBottom: "5px solid transparent",
                    borderRight: "6px solid hsl(var(--muted))",
                  }}
                />
                <div
                  className="rounded-xl px-3 py-2 text-xs leading-snug shadow-sm border border-border/40"
                  style={{
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  <span className="font-semibold text-[10px] uppercase tracking-wide opacity-60 block mb-0.5">
                    Elokwentny Pająk
                  </span>
                  {message}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
