import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User as UserIcon, LogOut, UserCircle, GraduationCap, FileText, FolderPlus, Lightbulb, Crown, ChevronDown, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, type DifficultyLevel } from "@/hooks/use-profile";
import { StatsPanel } from "@/components/StatsPanel";
import { NotificationDialog } from "@/components/NotificationDialog";
import type { DayRecord } from "@/hooks/use-learning-history";
import { toast } from "sonner";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onAddWord?: () => void;
  onCreateFolder?: () => void;
  onSuggestWord?: () => void;
  onOpenPremium?: () => void;
  isPremium?: boolean;
  // Stats props
  todayCount?: number;
  dailyGoal?: number;
  totalFavorites?: number;
  totalViewed?: number;
  weekData?: DayRecord[];
  weekFavData?: DayRecord[];
  weekViewData?: DayRecord[];
  streak?: number;
  masteredCount?: number;
}

const difficultyOptions: { value: DifficultyLevel; label: string; desc: string }[] = [
  { value: "beginner", label: "Początkujący", desc: "Proste słowa i podstawy" },
  { value: "intermediate", label: "Średni", desc: "Rozszerzone słownictwo" },
  { value: "advanced", label: "Zaawansowany", desc: "Pełne bogactwo języka" },
];

export function AuthDialog({
  open,
  onClose,
  onAddWord,
  onCreateFolder,
  onSuggestWord,
  onOpenPremium,
  isPremium,
  todayCount = 0,
  dailyGoal = 5,
  totalFavorites = 0,
  totalViewed = 0,
  weekData = [],
  weekFavData = [],
  weekViewData = [],
  streak = 0,
  masteredCount = 0,
}: AuthDialogProps) {
  const { user, signUp, signIn, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [tab, setTab] = useState<"account" | "stats">("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (mode === "register" && !name.trim()) return;
    setSubmitting(true);
    try {
      if (mode === "register") {
        const { error } = await signUp(email, password, name.trim());
        if (error) throw error;
        toast.success("Sprawdź swoją skrzynkę e-mail, aby potwierdzić konto!");
        setMode("login");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("Zalogowano pomyślnie!");
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Wystąpił błąd");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Wylogowano");
    onClose();
  };

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
          className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {user
                ? tab === "stats"
                  ? "Statystyki"
                  : "Twoje konto"
                : mode === "login"
                  ? "Zaloguj się"
                  : "Utwórz konto"}
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Tabs (only when logged in) */}
          {user && (
            <div className="flex gap-1 p-2 border-b border-border flex-shrink-0">
              <button
                onClick={() => setTab("account")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tab === "account"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                <UserCircle size={14} />
                Konto
              </button>
              <button
                onClick={() => setTab("stats")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tab === "stats"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                <Lightbulb size={14} />
                Statystyki
              </button>
            </div>
          )}

          <div className="p-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {user && tab === "stats" ? (
              <StatsPanel
                todayCount={todayCount}
                dailyGoal={dailyGoal}
                totalFavorites={totalFavorites}
                totalViewed={totalViewed}
                weekData={weekData}
                weekFavData={weekFavData}
                weekViewData={weekViewData}
                streak={streak}
                masteredCount={masteredCount}
              />
            ) : user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                  <UserCircle size={18} className="text-muted-foreground" />
                  <div className="flex flex-col min-w-0">
                    {profile?.name && (
                      <span className="text-sm font-medium truncate">{profile.name}</span>
                    )}
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                </div>

                {/* Difficulty level selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <GraduationCap size={16} className="text-muted-foreground" />
                    Poziom trudności
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {difficultyOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={async () => {
                          try {
                            await updateProfile({ difficulty_level: opt.value });
                            toast.success(`Poziom: ${opt.label}`);
                          } catch {
                            toast.error("Nie udało się zmienić poziomu");
                          }
                        }}
                        className={`p-2 rounded-xl text-center transition-colors cursor-pointer border ${
                          profile?.difficulty_level === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                        }`}
                      >
                        <span className="text-xs font-medium block">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="space-y-1">
                  <button
                    onClick={() => { onClose(); onAddWord?.(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors cursor-pointer text-left"
                  >
                    <FileText size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">Dodaj nowe słowo</span>
                  </button>
                  <button
                    onClick={() => { onClose(); onCreateFolder?.(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors cursor-pointer text-left"
                  >
                    <FolderPlus size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">Utwórz folder</span>
                  </button>
                  <button
                    onClick={() => { onClose(); onSuggestWord?.(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors cursor-pointer text-left"
                  >
                    <Lightbulb size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">Zaproponuj słowo</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Twoje ulubione słowa i własne słowa są synchronizowane z kontem.
                </p>

                {/* Daily push notification */}
                <button
                  onClick={() => setNotifOpen(true)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Bell size={16} className="text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Codzienne powiadomienie</p>
                      <p className="text-[11px] text-muted-foreground truncate">Przypomnienie push w aplikacji</p>
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-muted-foreground -rotate-90 flex-shrink-0" />
                </button>

                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary">
                  <label htmlFor="daily-email" className="text-sm font-medium cursor-pointer">
                    Codzienne słowo na e-mail
                  </label>
                  <Switch
                    id="daily-email"
                    checked={profile?.daily_email_enabled ?? false}
                    onCheckedChange={async (checked) => {
                      try {
                        await updateProfile({ daily_email_enabled: checked });
                        toast.success(checked ? "Włączono codzienne e-maile!" : "Wyłączono codzienne e-maile");
                      } catch {
                        toast.error("Nie udało się zmienić ustawienia");
                      }
                    }}
                  />
                </div>
                {isPremium ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
                    <Crown size={16} className="text-primary" />
                    <span className="text-sm font-medium text-primary">Premium aktywne</span>
                  </div>
                ) : (
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                    onClick={onOpenPremium}
                  >
                    <Crown size={16} />
                    Przejdź na Premium — 5,99 zł/mies.
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <LogOut size={16} />
                  Wyloguj się
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  {mode === "register" && (
                    <div className="relative">
                      <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Twoje imię *"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={50}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      placeholder="Hasło"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "..." : mode === "login" ? "Zaloguj" : "Zarejestruj"}
                </button>

                <p className="text-xs text-center text-muted-foreground">
                  {mode === "login" ? "Nie masz konta?" : "Masz już konto?"}{" "}
                  <button
                    type="button"
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    className="text-primary font-medium hover:underline cursor-pointer"
                  >
                    {mode === "login" ? "Zarejestruj się" : "Zaloguj się"}
                  </button>
                </p>
              </form>
            )}
          </div>
        </motion.div>
        <NotificationDialog open={notifOpen} onClose={() => setNotifOpen(false)} />
      </motion.div>
    </AnimatePresence>
  );
}
