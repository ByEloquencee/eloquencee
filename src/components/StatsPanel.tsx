import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, BookOpen, TrendingUp, Eye, Bell, Clock, Crown, X, Instagram, Mail, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayRecord } from "@/hooks/use-learning-history";
import { WidgetSetupCard } from "@/components/WidgetSetupCard";
import { useNotifications, isNativePlatform } from "@/hooks/use-notifications";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface StatsPanelProps {
  todayCount: number;
  dailyGoal: number;
  totalFavorites: number;
  totalViewed: number;
  weekData?: DayRecord[];
  weekFavData?: DayRecord[];
  weekViewData?: DayRecord[];
  streak?: number;
  masteredCount?: number;
}

const DAY_LABELS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];
const WEEKLY_CHART_MAX = 15;

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const jsDay = d.getDay();
  return DAY_LABELS[jsDay === 0 ? 6 : jsDay - 1];
}

function PremiumDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-primary" />
              <h2 className="text-lg font-semibold">Premium</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ta funkcja jest dostępna tylko dla użytkowników <span className="font-semibold text-foreground">Premium</span>. 
              Wiele powiadomień dziennie oraz personalizacja godzin przypomnień to funkcje premium.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-primary" />
                <span>Do 5 powiadomień dziennie</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                <span>Ustawienie godzin powiadomień</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown size={14} className="text-primary" />
                <span>Więcej funkcji wkrótce...</span>
              </div>
            </div>
            <button
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              onClick={onClose}
            >
              Wkrótce dostępne
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function NotificationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedCount, setSelectedCount] = useState(1);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const countOptions = [1, 2, 3, 5];

  if (!open) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-primary" />
                <h2 className="text-lg font-semibold">Przypomnienia</h2>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Ile razy dziennie?</p>
                <div className="grid grid-cols-4 gap-2">
                  {countOptions.map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        if (count > 1) {
                          setPremiumOpen(true);
                        } else {
                          setSelectedCount(count);
                        }
                      }}
                      className={`relative py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border ${
                        selectedCount === count
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                      }`}
                    >
                      {count}×
                      {count > 1 && (
                        <Crown size={10} className="absolute top-1 right-1 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={() => setPremiumOpen(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">Ustaw godzinę</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Crown size={12} className="text-primary" />
                    <span className="text-xs text-muted-foreground">Premium</span>
                  </div>
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                Zapisz
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <PremiumDialog open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  );
}

export function StatsPanel({ todayCount, dailyGoal, totalFavorites, totalViewed, weekData = [], weekFavData = [], weekViewData = [], streak = 0, masteredCount = 0 }: StatsPanelProps) {
  const [notifOpen, setNotifOpen] = useState(false);

  const displayData = weekViewData.length > 0
    ? weekViewData
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { date: d.toISOString().slice(0, 10), count: 0 };
      });

  const chartData = displayData.map((d) => ({
    ...d,
    day: getDayLabel(d.date),
    value: Math.min(d.count, WEEKLY_CHART_MAX),
  }));

  const weeklyTotal = displayData.reduce((s, d) => s + d.count, 0);
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
        <h2 className="text-lg font-semibold">Twój progres</h2>
        <p className="text-xs text-muted-foreground">Statystyki nauki słówek</p>
      </div>

      <div
        data-scroll-panel
        className="flex-1 overflow-y-auto px-1 pb-4 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
      >
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
              <p className="text-3xl font-bold text-foreground">{streak}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {streak === 1 ? "dzień" : "dni z rzędu"}
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
          <motion.div variants={itemVariants} className="rounded-2xl bg-card border border-border p-4 pb-3 mb-3">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-sm font-semibold">Ten tydzień</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Przejrzane słowa dziennie</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground tabular-nums">{weeklyTotal}</span>
                <p className="text-[10px] text-muted-foreground font-medium">łącznie</p>
              </div>
            </div>

            <div className="h-36 -ml-2 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="weeklyChartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.25} />
                      <stop offset="60%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.25} vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 500 }}
                    dy={4}
                  />
                  <YAxis
                    domain={[-0.5, WEEKLY_CHART_MAX]}
                    ticks={[0, 5, 10, 15]}
                    tickLine={false}
                    axisLine={false}
                    width={22}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                  />
                  {dailyGoal <= WEEKLY_CHART_MAX && (
                    <ReferenceLine
                      y={dailyGoal}
                      stroke="hsl(var(--primary))"
                      strokeOpacity={0.3}
                      strokeDasharray="6 3"
                      label={{
                        value: "cel",
                        position: "right",
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 9,
                      }}
                    />
                  )}
                  <Tooltip
                    cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                    content={({ active, payload, label }) => {
                      if (active && payload?.length) {
                        return (
                          <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-xs">
                            <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                            <span className="text-base font-bold text-foreground">{payload[0].value}</span>
                            <span className="text-muted-foreground ml-1">słów</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="none"
                    fill="url(#weeklyChartFill)"
                    isAnimationActive
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(25, 95%, 53%)"
                    strokeWidth={3}
                    strokeLinecap="round"
                    dot={{ r: 4, strokeWidth: 2.5, stroke: "hsl(25, 95%, 53%)", fill: "hsl(var(--card))" }}
                    activeDot={{ r: 6, strokeWidth: 2.5, stroke: "hsl(25, 95%, 53%)", fill: "hsl(25, 95%, 53%)" }}
                    isAnimationActive
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Summary stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 mb-3">
            {[
              { icon: BookOpen, value: masteredCount, label: "Nauczone" },
              { icon: TrendingUp, value: avgDaily, label: "Śr. dziennie" },
              { icon: Eye, value: totalViewed, label: "Przejrzane" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-2xl bg-card border border-border p-3 text-center">
                <div className="inline-flex p-1.5 rounded-lg bg-secondary mb-1.5">
                  <Icon size={14} className="text-muted-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Projection */}
          <motion.div variants={itemVariants} className="rounded-2xl bg-card border border-border p-4 mb-3">
            <p className="text-sm font-semibold mb-1.5">Prognoza nauki</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Przy obecnym tempie ({avgDaily} słów/dzień) nauczysz się{" "}
              <span className="font-semibold text-foreground">{monthProjection} słów</span> w tym miesiącu i{" "}
              <span className="font-semibold text-foreground">{Math.round(avgDaily * 365)} słów</span> w ciągu roku.
            </p>
          </motion.div>

          {/* Notification button */}
          <motion.div variants={itemVariants}>
            <button
              onClick={() => setNotifOpen(true)}
              className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors cursor-pointer text-left"
            >
              <div className="p-2 rounded-xl bg-primary/10">
                <Bell size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Przypomnienia</p>
                <p className="text-xs text-muted-foreground">Ustaw powiadomienia o nauce</p>
              </div>
            </button>
          </motion.div>

          {/* iOS Widget */}
          <motion.div variants={itemVariants} className="mt-3">
            <WidgetSetupCard />
          </motion.div>

          {/* Social & Contact */}
          <motion.div variants={itemVariants} className="mt-3 rounded-2xl bg-card border border-border p-4 space-y-3">
            <a
              href="https://www.instagram.com/eloquenceepl"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:bg-secondary/50 rounded-xl p-2 -m-2 transition-colors"
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10">
                <Instagram size={18} className="text-pink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Zaobserwuj nas</p>
                <p className="text-xs text-muted-foreground">@eloquenceepl na Instagramie</p>
              </div>
            </a>
            <div className="border-t border-border" />
            <a
              href="mailto:eloquencee.app@gmail.com"
              className="flex items-center gap-3 hover:bg-secondary/50 rounded-xl p-2 -m-2 transition-colors"
            >
              <div className="p-2 rounded-xl bg-primary/10">
                <Mail size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Kontakt</p>
                <p className="text-xs text-muted-foreground">eloquencee.app@gmail.com</p>
              </div>
            </a>
          </motion.div>

        </motion.div>
      </div>

      <NotificationDialog open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}

