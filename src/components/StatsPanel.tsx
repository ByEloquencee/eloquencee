import { motion } from "framer-motion";
import { Flame, Target, BookOpen, TrendingUp, Trophy, Bell, Smartphone } from "lucide-react";
import { useState } from "react";
import type { DayRecord } from "@/hooks/use-learning-history";

interface StatsPanelProps {
  todayCount: number;
  dailyGoal: number;
  totalFavorites: number;
  weekData?: DayRecord[];
  streak?: number;
}

const DAY_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  // JS getDay(): 0=Sun, 1=Mon...
  const jsDay = d.getDay();
  return DAY_LABELS[jsDay === 0 ? 6 : jsDay - 1];
}

function NotificationCard() {
  const [enabled, setEnabled] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="rounded-2xl bg-card border border-border p-4 mt-3"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-secondary">
          <Bell size={18} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold">
              Przypomnienia
            </p>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-10 h-[22px] rounded-full transition-colors duration-300 cursor-pointer ${
                enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <motion.div
                className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-background shadow-sm"
                animate={{ left: enabled ? 19 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {enabled
              ? "Będziesz otrzymywać codzienne przypomnienia o nauce!"
              : "Włącz powiadomienia, aby nie zapomnieć o nauce."}
          </p>
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 flex items-center gap-1.5 text-[10px] text-primary font-medium"
            >
              <Smartphone size={11} />
              <span>Dostępne w wersji mobilnej</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function StatsPanel({ todayCount, dailyGoal, totalFavorites, weekData = [], streak = 0 }: StatsPanelProps) {
  const displayData = weekData.length > 0
    ? weekData
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { date: d.toISOString().slice(0, 10), count: 0 };
      });

  const weeklyTotal = displayData.reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(...displayData.map(d => d.count), dailyGoal, 1);
  const avgDaily = Math.round(weeklyTotal / 7 * 10) / 10;
  const monthProjection = Math.round(avgDaily * 30);
  const goalPercent = Math.min((todayCount / dailyGoal) * 100, 100);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="w-full max-w-lg mx-auto h-full min-h-0 flex flex-col overflow-hidden">
      <div className="px-1 pb-3">
        <h2 className="text-lg font-semibold">
          Twój progres
        </h2>
        <p className="text-xs text-muted-foreground">Statystyki nauki słówek</p>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-4 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">

          {/* Streak + Today's goal */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Flame size={16} className="text-primary" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Seria</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {streak}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {streak === 1 ? "dzień" : streak >= 2 && streak <= 4 ? "dni z rzędu" : "dni z rzędu"}
              </p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Target size={16} className="text-primary" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">Dziś</span>
              </div>
              <p className="text-3xl font-bold">
                <span className="text-foreground">{todayCount}</span>
                <span className="text-base text-muted-foreground font-normal">/{dailyGoal}</span>
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goalPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>
          </motion.div>

          {/* Weekly chart */}
          <motion.div variants={itemVariants} className="rounded-2xl bg-card border border-border p-4 mb-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Ten tydzień</span>
              <span className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-0.5 rounded-full tabular-nums">
                {weeklyTotal} słów
              </span>
            </div>
            <div className="flex items-end gap-2 h-24">
              {displayData.map((d, i) => {
                const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                const isToday = i === displayData.length - 1;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                      {d.count > 0 ? d.count : ""}
                    </span>
                    <div className="w-full relative rounded-lg bg-secondary/50" style={{ height: "100%" }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 4)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                        className={`absolute bottom-0 w-full rounded-lg ${
                          isToday ? "bg-primary" : "bg-primary/25"
                        }`}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {getDayLabel(d.date)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="h-px flex-1 border-t border-dashed border-border" />
              <span className="text-[10px] text-muted-foreground">cel: {dailyGoal}/dzień</span>
            </div>
          </motion.div>

          {/* Summary stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 mb-3">
            {[
              { icon: BookOpen, value: totalFavorites, label: "Nauczone" },
              { icon: TrendingUp, value: avgDaily, label: "Śr. dziennie" },
              { icon: Trophy, value: monthProjection, label: "Prognoza/mies." },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-2xl bg-card border border-border p-3 text-center">
                <div className="inline-flex p-1.5 rounded-lg bg-secondary mb-1.5">
                  <Icon size={14} className="text-muted-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Projection */}
          <motion.div variants={itemVariants} className="rounded-2xl bg-card border border-border p-4">
            <p className="text-sm font-semibold mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
              Prognoza nauki
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Przy obecnym tempie ({avgDaily} słów/dzień) nauczysz się{" "}
              <span className="font-semibold text-foreground">{monthProjection} słów</span>{" "}
              w tym miesiącu i{" "}
              <span className="font-semibold text-foreground">{Math.round(avgDaily * 365)} słów</span>{" "}
              w ciągu roku.
            </p>
          </motion.div>

          <NotificationCard />

        </motion.div>
      </div>
    </div>
  );
}
