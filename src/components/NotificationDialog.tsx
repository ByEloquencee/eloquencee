import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Smartphone, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { useModerator } from "@/hooks/use-moderator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const HOUR_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 - 21:00

interface NotificationDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationDialog({ open, onClose }: NotificationDialogProps) {
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
        className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
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
