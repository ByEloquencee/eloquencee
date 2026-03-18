import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IDLE_TIMEOUT = 15 * 1000;
const VISIBLE_DURATION = 8 * 1000;

interface SpiderWebProps {
  todayCount?: number;
  dailyGoal?: number;
  streak?: number;
  forceShow?: boolean;
  onHide?: () => void;
}

const MESSAGES_QUIZ = [
  "Sprawdź się w quizie! 🧠",
  "Czas na quiz! 💪",
  "Wypróbuj tryb quizu!",
];

const MESSAGES_KNOWLEDGE = [
  "Ile słów już znasz? 📚",
  "Przetestuj swoją wiedzę!",
  "Powtórka czyni mistrza! 🎯",
];

const MESSAGES_NOTIFICATIONS = [
  "Włącz powiadomienia! 🔔",
  "Włącz przypomnienia!",
];

function getProgressMessages(todayCount: number, dailyGoal: number, streak: number): string[] {
  const msgs: string[] = [];

  if (todayCount === 0) {
    msgs.push("Nowe słówko czeka! ☀️");
  } else if (todayCount < dailyGoal) {
    const left = dailyGoal - todayCount;
    msgs.push(`Jeszcze ${left} do celu! 🎯`);
  } else {
    msgs.push("Cel osiągnięty! Brawo! 🏆");
  }

  if (streak >= 3) {
    msgs.push(`Passa ${streak} dni! 🔥`);
  }

  if (todayCount >= 5) {
    msgs.push(`${todayCount} słów dziś! 🚀`);
  }

  return msgs;
}

function SpiderSVG() {
  return (
    <svg
      width="30"
      height="28"
      viewBox="0 0 30 28"
      style={{ color: "hsl(var(--muted-foreground))" }}
      aria-hidden="true"
    >
      <g>
        <path d="M 12 9 Q 7 4 3 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 12 11 Q 5 9 1 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 11 14 Q 5 16 2 20" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 11 16 Q 6 19 3 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g>
        <path d="M 18 9 Q 23 4 27 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 18 11 Q 25 9 29 7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 19 14 Q 25 16 28 20" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 19 16 Q 24 19 27 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <circle cx="15" cy="9" r="5" fill="currentColor" opacity="0.75" />
      <ellipse cx="15" cy="18" rx="6" ry="5.5" fill="currentColor" opacity="0.6" />
      <ellipse cx="15" cy="17" rx="2.5" ry="2" fill="hsl(var(--background))" opacity="0.1" />

      <circle cx="12.5" cy="8" r="2.2" fill="hsl(var(--background))" />
      <circle cx="17.5" cy="8" r="2.2" fill="hsl(var(--background))" />
      <circle cx="12.5" cy="8" r="1.1" fill="hsl(var(--foreground))" />
      <circle cx="17.5" cy="8" r="1.1" fill="hsl(var(--foreground))" />
      <circle cx="11.8" cy="7" r="0.5" fill="hsl(var(--background))" opacity="0.7" />
      <circle cx="16.8" cy="7" r="0.5" fill="hsl(var(--background))" opacity="0.7" />

      <path
        d="M 13.5 11 Q 15 12.5 16.5 11"
        stroke="hsl(var(--background))"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SpiderWeb({ todayCount = 0, dailyGoal = 5, streak = 0, forceShow = false, onHide }: SpiderWebProps) {
  const [visible, setVisible] = useState(false);
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  const allMessages = useMemo(
    () => [
      ...MESSAGES_QUIZ,
      ...MESSAGES_KNOWLEDGE,
      ...MESSAGES_NOTIFICATIONS,
      ...getProgressMessages(todayCount, dailyGoal, streak),
    ],
    [todayCount, dailyGoal, streak],
  );

  const [message, setMessage] = useState(() => allMessages[0] ?? "");

  useEffect(() => {
    if (forceShow || visible) return;

    const showTimer = setTimeout(() => setVisible(true), IDLE_TIMEOUT);
    return () => clearTimeout(showTimer);
  }, [forceShow, visible]);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
    }
  }, [forceShow]);

  useEffect(() => {
    if (!visible) return;

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, VISIBLE_DURATION);

    return () => clearTimeout(hideTimer);
  }, [visible]);

  // Pick a new message only when spider appears
  useEffect(() => {
    if (visible) {
      setMessage(allMessages[Math.floor(Math.random() * allMessages.length)] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <AnimatePresence
      onExitComplete={() => onHideRef.current?.()}
    >
      {visible && (
        <motion.div
          key="spider"
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ originY: 0, willChange: "transform, opacity", transform: "translateZ(0)" }}
          className="pointer-events-none select-none absolute left-[10px] top-full -mt-4 z-0 overflow-visible"
        >
          <div className="flex flex-col items-center pt-4">
            <svg
              width="32"
              height="14"
              viewBox="0 0 32 14"
              className="block -mb-[1px]"
              style={{ color: "hsl(var(--muted-foreground))", opacity: 0.35, transform: "scaleY(-1)" }}
              aria-hidden="true"
            >
              <line x1="16" y1="0" x2="0" y2="12" stroke="currentColor" strokeWidth="0.6" />
              <line x1="16" y1="0" x2="6" y2="13" stroke="currentColor" strokeWidth="0.6" />
              <line x1="16" y1="0" x2="16" y2="14" stroke="currentColor" strokeWidth="0.6" />
              <line x1="16" y1="0" x2="26" y2="13" stroke="currentColor" strokeWidth="0.6" />
              <line x1="16" y1="0" x2="32" y2="12" stroke="currentColor" strokeWidth="0.6" />
              <path d="M 4 5 Q 10 7 16 5 Q 22 7 28 5" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <path d="M 1 9 Q 8 12 16 9 Q 24 12 31 9" stroke="currentColor" strokeWidth="0.5" fill="none" />
            </svg>

            <div
              className="rounded-full"
              style={{
                width: "1.5px",
                height: "28px",
                background: "linear-gradient(to bottom, hsl(var(--muted-foreground) / 0.25), hsl(var(--muted-foreground) / 0.08))",
              }}
            />

            <motion.div
              className="relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.3 }}
            >
              <motion.div
                className="origin-top"
                animate={{ rotate: [0, 6, -5, 3, 0] }}
                transition={{ duration: 1.5, delay: 0.4, ease: "easeInOut" }}
              >
                <SpiderSVG />
              </motion.div>

              <motion.div
                className="absolute -top-2 left-full ml-3"
                style={{ width: "max-content", maxWidth: "min(280px, calc(100vw - 80px))" }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.3, ease: "easeOut" }}
              >
                <div
                  className="absolute left-0 top-3 -translate-x-[5px] w-0 h-0"
                  style={{
                    borderTop: "5px solid transparent",
                    borderBottom: "5px solid transparent",
                    borderRight: "6px solid hsl(var(--muted))",
                  }}
                />
                <div
                  className="rounded-xl border border-border/40 px-3 py-2 text-xs leading-snug shadow-sm whitespace-nowrap"
                  style={{
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  {message}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}