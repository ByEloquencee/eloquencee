import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";
import { useState } from "react";

interface StatsPanelProps {
  todayCount: number;
  dailyGoal: number;
  totalFavorites: number;
}

function NotificationCard() {
  const [enabled, setEnabled] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-2xl bg-gradient-to-br from-primary/8 via-card to-accent/8 border-[3px] border-foreground/15 p-4 mt-4 shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.08)]"
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={enabled ? { rotate: [0, -10, 10, -5, 0] } : {}}
          transition={{ duration: 0.6, repeat: enabled ? Infinity : 0, repeatDelay: 2.5 }}
          className="text-3xl flex-shrink-0"
        >
          🔔
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Przypomnienia
            </p>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-11 h-6 rounded-full border-[2.5px] border-foreground/20 transition-colors duration-300 cursor-pointer ${
                enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <motion.div
                className="absolute top-[1px] w-[17px] h-[17px] rounded-full bg-background border-2 border-foreground/15 shadow-sm"
                animate={{ left: enabled ? 20 : 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {enabled
              ? "Będziesz otrzymywać codzienne przypomnienia o nauce!"
              : "Włącz codzienne powiadomienia, aby nie zapomnieć o nauce słówek."}
          </p>
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 flex items-center gap-1.5 text-[10px] text-primary font-medium"
            >
              <Smartphone size={12} />
              <span>Powiadomienia będą dostępne w wersji mobilnej</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

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
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const goalPercent = Math.min((todayCount / dailyGoal) * 100, 100);

  // Shared cartoon card style
  const cardClass = "rounded-2xl border-[3px] border-foreground/15 shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.08)]";

  return (
    <div className="w-full max-w-lg mx-auto h-full min-h-0 flex flex-col overflow-hidden">
      <div className="px-1 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📊</span>
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

          {/* Streak + Today */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-4">
            <div className={`relative overflow-hidden bg-gradient-to-br from-primary/12 to-primary/4 p-4 ${cardClass}`}>
              <span className="absolute -top-1 -right-1 text-4xl opacity-80">🔥</span>
              <p className="text-3xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{streak}</p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Dni z rzędu</p>
            </div>
            <div className={`relative overflow-hidden bg-gradient-to-br from-accent/12 to-accent/4 p-4 ${cardClass}`}>
              <span className="absolute -top-1 -right-1 text-4xl opacity-70">🎯</span>
              <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                <span className="text-primary">{todayCount}</span>
                <span className="text-base text-muted-foreground font-normal">/{dailyGoal}</span>
              </p>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Dzisiejszy cel</p>
              {/* Progress bar with thick outline */}
              <div className="mt-2 h-3 rounded-full bg-secondary border-[2.5px] border-foreground/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goalPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
            </div>
          </motion.div>

          {/* Weekly chart */}
          <motion.div variants={itemVariants} className={`bg-card p-4 mb-4 ${cardClass}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">📅 Ten tydzień</span>
              <span className="text-xs text-muted-foreground font-medium bg-secondary border-2 border-foreground/10 px-2 py-0.5 rounded-full">{weeklyTotal} słów</span>
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
                    <div className="w-full relative rounded-xl overflow-hidden bg-secondary/60 border-[2.5px] border-foreground/8" style={{ height: "100%" }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 6)}%` }}
                        transition={{ duration: 0.7, delay: i * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
                        className={`absolute bottom-0 w-full rounded-lg ${
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
              <div className="h-px flex-1 border-t-[2.5px] border-dashed border-primary/25" />
              <span className="text-[10px] text-primary/60 font-semibold">cel: {dailyGoal}/dzień</span>
            </div>
          </motion.div>

          {/* Stats cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2.5 mb-4">
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className={`bg-card p-3 text-center ${cardClass}`}
            >
              <span className="text-2xl block mb-1">📚</span>
              <p className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{totalFavorites}</p>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Nauczone</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className={`bg-card p-3 text-center ${cardClass}`}
            >
              <span className="text-2xl block mb-1">📈</span>
              <p className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{avgDaily}</p>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Śr. dziennie</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -2, scale: 1.02 }}
              className={`bg-card p-3 text-center ${cardClass}`}
            >
              <span className="text-2xl block mb-1">🏆</span>
              <p className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{monthProjection}</p>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Prognoza/mies.</p>
            </motion.div>
          </motion.div>

          {/* Projection card */}
          <motion.div variants={itemVariants} className={`bg-gradient-to-br from-primary/10 via-card to-accent/10 p-4 ${cardClass}`}>
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-3xl flex-shrink-0"
              >
                🚀
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1.5" style={{ fontFamily: "var(--font-display)" }}>Prognoza nauki</p>
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

          <NotificationCard />

        </motion.div>
      </div>
    </div>
  );
}
