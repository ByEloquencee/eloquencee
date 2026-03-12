import { motion } from "framer-motion";
import { TrendingUp, Calendar, Flame, Target, BookOpen, Award, ArrowUpRight } from "lucide-react";

interface StatsPanelProps {
  todayCount: number;
  dailyGoal: number;
  totalFavorites: number;
}

export function StatsPanel({ todayCount, dailyGoal, totalFavorites }: StatsPanelProps) {
  // Mock data for UI — will be replaced with real data later
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
  const streak = 5; // mock
  const monthProjection = Math.round(avgDaily * 30);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="w-full max-w-lg mx-auto h-full min-h-0 flex flex-col overflow-hidden">
      <div className="px-1 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Twój progres
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Statystyki nauki słówek</p>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">

          {/* Streak + Today */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-4">
              <div className="absolute top-2 right-2 opacity-10">
                <Flame size={40} />
              </div>
              <Flame size={18} className="text-primary mb-1" />
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{streak}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Dni z rzędu</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20 p-4">
              <div className="absolute top-2 right-2 opacity-10">
                <Target size={40} />
              </div>
              <Target size={18} className="text-accent mb-1" />
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {todayCount}<span className="text-sm text-muted-foreground font-normal">/{dailyGoal}</span>
              </p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Dziś</p>
            </div>
          </motion.div>

          {/* Weekly chart */}
          <motion.div variants={itemVariants} className="rounded-2xl bg-card border border-border p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">Ten tydzień</span>
              </div>
              <span className="text-xs text-muted-foreground">{weeklyTotal} słów</span>
            </div>
            <div className="flex items-end gap-2 h-28">
              {weeklyData.map((d, i) => {
                const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                const isToday = i === weeklyData.length - 1;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground">{d.count}</span>
                    <div className="w-full relative rounded-lg overflow-hidden bg-secondary" style={{ height: "100%" }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 4)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                        className={`absolute bottom-0 w-full rounded-lg ${
                          isToday
                            ? "bg-gradient-to-t from-primary to-primary/70"
                            : "bg-gradient-to-t from-primary/40 to-primary/20"
                        }`}
                      />
                    </div>
                    <span className={`text-[10px] ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Goal line indicator */}
            <div className="mt-2 flex items-center gap-1.5">
              <div className="h-px flex-1 bg-primary/30 border-dashed border-t border-primary/30" />
              <span className="text-[9px] text-primary/60 font-medium">cel: {dailyGoal}/dzień</span>
            </div>
          </motion.div>

          {/* Stats cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <BookOpen size={14} className="text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{totalFavorites}</p>
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Nauczone</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <TrendingUp size={14} className="text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{avgDaily}</p>
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Śr. dziennie</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <Award size={14} className="text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{monthProjection}</p>
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Prognoza/mies.</p>
            </div>
          </motion.div>

          {/* Projection card */}
          <motion.div variants={itemVariants} className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary/15">
                <ArrowUpRight size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">Prognoza nauki</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Przy obecnym tempie ({avgDaily} słów/dzień) nauczysz się{" "}
                  <span className="font-semibold text-foreground">{monthProjection} słów</span>{" "}
                  w tym miesiącu i{" "}
                  <span className="font-semibold text-foreground">{Math.round(avgDaily * 365)} słów</span>{" "}
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
