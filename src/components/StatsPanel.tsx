import { motion } from "framer-motion";

interface StatsPanelProps {
  todayCount: number;
  dailyGoal: number;
  totalFavorites: number;
}

// Cartoon-style inline SVG illustrations
const FlameCartoon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none">
    <ellipse cx="32" cy="56" rx="14" ry="4" fill="hsl(var(--primary) / 0.15)" />
    <path d="M32 8c0 0-18 16-18 32a18 18 0 0036 0C50 24 32 8 32 8z" fill="hsl(var(--primary) / 0.85)" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" />
    <path d="M32 22c0 0-9 10-9 20a9 9 0 0018 0C41 32 32 22 32 22z" fill="hsl(var(--accent) / 0.9)" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M32 34c0 0-4 5-4 10a4 4 0 008 0C36 39 32 34 32 34z" fill="hsl(var(--primary-foreground))" opacity="0.8" />
    {/* Cartoon eyes */}
    <circle cx="27" cy="35" r="2.5" fill="hsl(var(--foreground))" />
    <circle cx="37" cy="35" r="2.5" fill="hsl(var(--foreground))" />
    <circle cx="28" cy="34" r="1" fill="white" />
    <circle cx="38" cy="34" r="1" fill="white" />
    {/* Smile */}
    <path d="M29 40 Q32 43 35 40" stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

const TargetCartoon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none">
    <ellipse cx="32" cy="58" rx="12" ry="3" fill="hsl(var(--accent) / 0.15)" />
    <circle cx="32" cy="32" r="24" fill="hsl(var(--accent) / 0.15)" stroke="hsl(var(--accent) / 0.4)" strokeWidth="2" />
    <circle cx="32" cy="32" r="17" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary) / 0.5)" strokeWidth="2" />
    <circle cx="32" cy="32" r="10" fill="hsl(var(--primary) / 0.4)" stroke="hsl(var(--primary) / 0.7)" strokeWidth="2" />
    <circle cx="32" cy="32" r="4" fill="hsl(var(--primary))" />
    {/* Arrow */}
    <line x1="48" y1="16" x2="35" y2="29" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
    <polygon points="50,10 54,18 46,18" fill="hsl(var(--foreground))" transform="rotate(-45, 50, 14)" />
    {/* Sparkles */}
    <circle cx="50" cy="12" r="1.5" fill="hsl(var(--primary))" />
    <circle cx="54" cy="20" r="1" fill="hsl(var(--accent))" />
  </svg>
);

const BookCartoon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <path d="M8 10 Q8 6 14 6 L24 6 L24 38 L14 38 Q8 38 8 34 Z" fill="hsl(var(--primary) / 0.25)" stroke="hsl(var(--primary) / 0.6)" strokeWidth="1.5" />
    <path d="M40 10 Q40 6 34 6 L24 6 L24 38 L34 38 Q40 38 40 34 Z" fill="hsl(var(--accent) / 0.25)" stroke="hsl(var(--accent) / 0.6)" strokeWidth="1.5" />
    <line x1="24" y1="6" x2="24" y2="38" stroke="hsl(var(--border))" strokeWidth="1.5" />
    {/* Lines on pages */}
    <line x1="12" y1="14" x2="20" y2="14" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="1" strokeLinecap="round" />
    <line x1="12" y1="18" x2="18" y2="18" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="1" strokeLinecap="round" />
    <line x1="28" y1="14" x2="36" y2="14" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="1" strokeLinecap="round" />
    <line x1="28" y1="18" x2="34" y2="18" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="1" strokeLinecap="round" />
    {/* Star on cover */}
    <polygon points="24,22 25.5,26 30,26 26.5,28.5 28,33 24,30 20,33 21.5,28.5 18,26 22.5,26" fill="hsl(var(--primary) / 0.5)" />
  </svg>
);

const ChartCartoon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <rect x="6" y="28" width="8" height="14" rx="3" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5" />
    <rect x="20" y="18" width="8" height="24" rx="3" fill="hsl(var(--primary) / 0.5)" stroke="hsl(var(--primary) / 0.7)" strokeWidth="1.5" />
    <rect x="34" y="8" width="8" height="34" rx="3" fill="hsl(var(--primary) / 0.8)" stroke="hsl(var(--primary))" strokeWidth="1.5" />
    {/* Eyes on tallest bar */}
    <circle cx="36.5" cy="14" r="1.2" fill="hsl(var(--foreground))" />
    <circle cx="39.5" cy="14" r="1.2" fill="hsl(var(--foreground))" />
    <circle cx="37" cy="13.5" r="0.5" fill="white" />
    <circle cx="40" cy="13.5" r="0.5" fill="white" />
    <path d="M37 17 Q38 18.5 39.5 17" stroke="hsl(var(--foreground))" strokeWidth="1" strokeLinecap="round" fill="none" />
  </svg>
);

const TrophyCartoon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none">
    <ellipse cx="24" cy="42" rx="10" ry="2.5" fill="hsl(var(--primary) / 0.15)" />
    {/* Base */}
    <rect x="18" y="36" width="12" height="4" rx="1.5" fill="hsl(var(--primary) / 0.4)" stroke="hsl(var(--primary) / 0.6)" strokeWidth="1" />
    <rect x="22" y="30" width="4" height="6" rx="1" fill="hsl(var(--primary) / 0.3)" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1" />
    {/* Cup */}
    <path d="M14 8 H34 L32 26 Q30 30 24 30 Q18 30 16 26 Z" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary) / 0.6)" strokeWidth="1.5" />
    {/* Handles */}
    <path d="M14 12 Q8 12 8 18 Q8 24 14 22" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5" fill="none" />
    <path d="M34 12 Q40 12 40 18 Q40 24 34 22" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5" fill="none" />
    {/* Star */}
    <polygon points="24,13 25.5,17 30,17 26.5,19.5 28,24 24,21 20,24 21.5,19.5 18,17 22.5,17" fill="hsl(var(--primary))" />
    {/* Sparkles */}
    <circle cx="12" cy="8" r="1.5" fill="hsl(var(--accent))" opacity="0.7" />
    <circle cx="38" cy="6" r="1" fill="hsl(var(--primary))" opacity="0.7" />
    <circle cx="8" cy="14" r="0.8" fill="hsl(var(--primary))" opacity="0.5" />
  </svg>
);

const RocketCartoon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none">
    {/* Exhaust */}
    <ellipse cx="32" cy="56" rx="6" ry="4" fill="hsl(var(--accent) / 0.3)" />
    <ellipse cx="32" cy="52" rx="4" ry="3" fill="hsl(var(--primary) / 0.4)" />
    {/* Body */}
    <path d="M32 6 Q24 18 24 36 L24 44 L40 44 L40 36 Q40 18 32 6z" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary) / 0.6)" strokeWidth="1.5" strokeLinejoin="round" />
    {/* Nose */}
    <path d="M32 6 Q28 14 28 20 Q32 16 36 20 Q36 14 32 6z" fill="hsl(var(--primary) / 0.5)" />
    {/* Window */}
    <circle cx="32" cy="28" r="5" fill="hsl(var(--accent) / 0.3)" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5" />
    <circle cx="32" cy="28" r="3" fill="hsl(var(--accent) / 0.15)" />
    <path d="M30 26.5 Q31 25.5 33 27" stroke="white" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6" />
    {/* Fins */}
    <path d="M24 38 L18 46 L24 44z" fill="hsl(var(--primary) / 0.4)" stroke="hsl(var(--primary) / 0.6)" strokeWidth="1" />
    <path d="M40 38 L46 46 L40 44z" fill="hsl(var(--primary) / 0.4)" stroke="hsl(var(--primary) / 0.6)" strokeWidth="1" />
    {/* Stars around */}
    <circle cx="14" cy="16" r="1.5" fill="hsl(var(--primary))" opacity="0.5" />
    <circle cx="50" cy="22" r="1" fill="hsl(var(--accent))" opacity="0.6" />
    <circle cx="18" cy="30" r="0.8" fill="hsl(var(--primary))" opacity="0.4" />
    <circle cx="48" cy="12" r="1.2" fill="hsl(var(--primary))" opacity="0.5" />
  </svg>
);

export function StatsPanel({ todayCount, dailyGoal, totalFavorites }: StatsPanelProps) {
  const weeklyData = [
    { day: "Pon", count: 4 },
    { day: "Wt", count: 7 },
    { day: "Śr", count: 3 },
    { day: "Czw", count: 5 },
    { day: "Pt", count: 6 },
    { day: "Sob", count: 2 },
    { day: "Ndz", count: todayCount },
  ];
  const maxCount = Math.max(...weeklyData.map(d => d.count), dailyGoal);
  const weeklyTotal = weeklyData.reduce((s, d) => s + d.count, 0);
  const avgDaily = Math.round(weeklyTotal / 7 * 10) / 10;
  const streak = 5;
  const monthProjection = Math.round(avgDaily * 30);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const goalPercent = Math.min((todayCount / dailyGoal) * 100, 100);

  return (
    <div className="w-full max-w-lg mx-auto h-full min-h-0 flex flex-col overflow-hidden">
      <div className="px-1 pb-3">
        <div className="flex items-center gap-2.5">
          <ChartCartoon className="w-7 h-7" />
          <div>
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Twój progres
            </h2>
            <p className="text-xs text-muted-foreground">Statystyki nauki słówek</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">

          {/* Streak + Today — cartoon cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/12 to-primary/4 border-2 border-primary/20 p-4">
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: [0, -8, 8, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <FlameCartoon className="w-14 h-14 opacity-80" />
              </motion.div>
              <p className="text-3xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{streak}</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Dni z rzędu 🔥</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/12 to-accent/4 border-2 border-accent/20 p-4">
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <TargetCartoon className="w-16 h-16 opacity-70" />
              </motion.div>
              <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                <span className="text-primary">{todayCount}</span>
                <span className="text-base text-muted-foreground font-normal">/{dailyGoal}</span>
              </p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Dzisiejszy cel 🎯</p>
              {/* Mini progress bar */}
              <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goalPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
            </div>
          </motion.div>

          {/* Weekly chart — rounded, bubbly bars */}
          <motion.div variants={itemVariants} className="rounded-2xl bg-card border-2 border-border p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">📅 Ten tydzień</span>
              <span className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-0.5 rounded-full">{weeklyTotal} słów</span>
            </div>
            <div className="flex items-end gap-2.5 h-28">
              {weeklyData.map((d, i) => {
                const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                const isToday = i === weeklyData.length - 1;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 + 0.3 }}
                      className="text-[10px] font-bold text-muted-foreground"
                    >
                      {d.count}
                    </motion.span>
                    <div className="w-full relative rounded-xl overflow-hidden bg-secondary/60" style={{ height: "100%" }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 6)}%` }}
                        transition={{ duration: 0.7, delay: i * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
                        className={`absolute bottom-0 w-full rounded-xl ${
                          isToday
                            ? "bg-gradient-to-t from-primary via-primary/80 to-accent/60"
                            : "bg-gradient-to-t from-primary/35 to-primary/15"
                        }`}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="h-px flex-1 border-t-2 border-dashed border-primary/25" />
              <span className="text-[10px] text-primary/60 font-semibold">cel: {dailyGoal}/dzień</span>
            </div>
          </motion.div>

          {/* Stats cards with cartoon icons */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2.5 mb-4">
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className="rounded-2xl bg-card border-2 border-border p-3 text-center"
            >
              <BookCartoon className="w-10 h-10 mx-auto mb-1" />
              <p className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{totalFavorites}</p>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Nauczone</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className="rounded-2xl bg-card border-2 border-border p-3 text-center"
            >
              <ChartCartoon className="w-10 h-10 mx-auto mb-1" />
              <p className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{avgDaily}</p>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Śr. dziennie</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className="rounded-2xl bg-card border-2 border-border p-3 text-center"
            >
              <TrophyCartoon className="w-10 h-10 mx-auto mb-1" />
              <p className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{monthProjection}</p>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Prognoza/mies.</p>
            </motion.div>
          </motion.div>

          {/* Projection card with rocket */}
          <motion.div variants={itemVariants} className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border-2 border-border p-4">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <RocketCartoon className="w-14 h-14 flex-shrink-0" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1.5" style={{ fontFamily: "var(--font-display)" }}>Prognoza nauki 🚀</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Przy obecnym tempie ({avgDaily} słów/dzień) nauczysz się{" "}
                  <span className="font-bold text-primary">{monthProjection} słów</span>{" "}
                  w tym miesiącu i{" "}
                  <span className="font-bold text-primary">{Math.round(avgDaily * 365)} słów</span>{" "}
                  w ciągu roku!
                </p>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
