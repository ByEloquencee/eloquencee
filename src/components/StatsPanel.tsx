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
import { useModerator } from "@/hooks/use-moderator";
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

const HOUR_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 - 21:00

function NotificationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, isNative, saveSettings, sendTestNotification } = useNotifications();
  const { isModerator } = useModerator();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [hour1, setHour1] = useState(settings.hour1);
  const [hour2, setHour2] = useState<number | null>(settings.hour2);
  const [twoPerDay, setTwoPerDay] = useState(settings.hour2 !== null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      await sendTestNotification();
      toast.success("Powiadomienie pojawi się za ~5 sekund");
    } catch (e) {
      const msg = e instanceof Error && e.message === "NOT_NATIVE"
        ? "Test działa tylko w aplikacji mobilnej (iOS/Android)"
        : e instanceof Error && e.message === "PERMISSION_DENIED"
        ? "Brak zgody na powiadomienia. Włącz je w Ustawieniach iOS."
        : "Nie udało się wysłać testowego powiadomienia";
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (open) {
      setEnabled(settings.enabled);
      setHour1(settings.hour1);
      setHour2(settings.hour2);
      setTwoPerDay(settings.hour2 !== null);
    }
  }, [open, settings]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalHour2 = twoPerDay ? (hour2 ?? 19) : null;
      await saveSettings({ enabled, hour1, hour2: finalHour2 });
      toast.success(
        enabled
          ? "Powiadomienia zaplanowane"
          : "Powiadomienia wyłączone",
      );
      onClose();
    } catch (e) {
      const msg = e instanceof Error && e.message === "PERMISSION_DENIED"
        ? "Brak zgody na powiadomienia. Włącz je w Ustawieniach iOS."
        : "Nie udało się zapisać ustawień";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

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
              <Bell size={18} className="text-primary" />
              <h2 className="text-lg font-semibold">Przypomnienia</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {!isNative && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/60 text-xs text-muted-foreground">
                <Smartphone size={14} className="mt-0.5 shrink-0" />
                <p>Powiadomienia działają tylko w aplikacji mobilnej (iOS/Android). Tutaj możesz je skonfigurować — ustawienia synchronizują się po zalogowaniu w aplikacji.</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Codzienne słowo</p>
                <p className="text-xs text-muted-foreground">Powiadomienie z nowym słowem</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {enabled && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pierwsza godzina</p>
                  <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1 -m-1">
                    {HOUR_OPTIONS.map((h) => (
                      <button
                        key={h}
                        onClick={() => setHour1(h)}
                        className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                          hour1 === h
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                        }`}
                      >
                        {String(h).padStart(2, "0")}:00
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Druga godzina</p>
                    <p className="text-xs text-muted-foreground">Drugie powiadomienie tego samego dnia</p>
                  </div>
                  <Switch checked={twoPerDay} onCheckedChange={setTwoPerDay} />
                </div>

                {twoPerDay && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Druga godzina</p>
                    <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1 -m-1">
                      {HOUR_OPTIONS.filter((h) => h !== hour1).map((h) => (
                        <button
                          key={h}
                          onClick={() => setHour2(h)}
                          className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                            (hour2 ?? 19) === h
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                          }`}
                        >
                          {String(h).padStart(2, "0")}:00
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
            >
              {saving ? "Zapisywanie..." : "Zapisz"}
            </button>

            {isModerator && (
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center gap-1.5">
                  <Crown size={12} className="text-primary" />
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Panel moderatora</p>
                </div>
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="w-full py-2.5 rounded-xl border border-border bg-secondary/50 text-secondary-foreground text-sm font-medium hover:bg-secondary transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Bell size={14} />
                  {testing ? "Wysyłanie..." : "Wyślij testowe powiadomienie"}
                </button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Pojawi się za ~5 sekund (tylko aplikacja mobilna)
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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

  const pills = [
    { icon: Flame, value: streak, label: "Seria" },
    { icon: BookOpen, value: masteredCount, label: "Nauczone" },
    { icon: Eye, value: totalViewed, label: "Przejrzane" },
    { icon: Target, value: `${todayCount}/${dailyGoal}`, label: "Dziś" },
  ];

  return (
    <div className="w-full max-w-lg mx-auto h-full min-h-0 flex flex-col overflow-hidden">
      <div
        data-scroll-panel
        className="flex-1 overflow-y-auto px-1 pt-1 pb-4 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
      >
        <motion.div variants={containerVariants} initial="hidden" animate="visible">

          {/* Top pills row */}
          <motion.div variants={itemVariants} className="flex gap-2 mb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {pills.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 shrink-0"
              >
                <Icon size={13} className="text-primary" />
                <span className="text-xs font-semibold text-foreground tabular-nums">{value}</span>
                <span className="text-[11px] text-muted-foreground">{label}</span>
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

