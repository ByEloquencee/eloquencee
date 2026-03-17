import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, Heart, Infinity, Dumbbell, GraduationCap, Bell, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";

interface PremiumDialogProps {
  open: boolean;
  onClose: () => void;
}

const SUPPORT_AMOUNTS = [
  { value: 5.99, label: "5,99 zł" },
  { value: 9.99, label: "9,99 zł" },
  { value: 19.99, label: "19,99 zł" },
  { value: 49.99, label: "49,99 zł" },
];

const FEATURES = [
  { icon: Infinity, label: "Brak limitu słów dziennie" },
  { icon: GraduationCap, label: "Quizy i ćwiczenia bez ograniczeń" },
  { icon: Dumbbell, label: "Zaawansowane ćwiczenia" },
  { icon: Bell, label: "Personalizacja powiadomień" },
  { icon: Sparkles, label: "Dostęp do AI chat" },
  { icon: Heart, label: "Wsparcie rozwoju aplikacji" },
];

export function PremiumDialog({ open, onClose }: PremiumDialogProps) {
  const { startCheckout, isPremium } = useSubscription();
  const { user } = useAuth();
  const [tab, setTab] = useState<"premium" | "support">("premium");
  const [supportAmount, setSupportAmount] = useState(9.99);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Zaloguj się, aby przejść do płatności");
      return;
    }
    setLoading(true);
    try {
      if (tab === "support") {
        const amount = customAmount ? parseFloat(customAmount.replace(",", ".")) : supportAmount;
        if (isNaN(amount) || amount < 5.99) {
          toast.error("Minimalna kwota to 5,99 zł");
          setLoading(false);
          return;
        }
        await startCheckout("support", amount);
      } else {
        await startCheckout("subscription");
      }
      toast.success("Przekierowanie do płatności...");
    } catch (err: any) {
      toast.error(err.message || "Nie udało się otworzyć płatności");
    } finally {
      setLoading(false);
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
          className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-primary" />
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {isPremium ? "Twoje Premium" : "Przejdź na Premium"}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {isPremium ? (
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown size={32} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Masz aktywne konto Premium! Korzystasz ze wszystkich funkcji bez ograniczeń.</p>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-secondary">
                  <button
                    onClick={() => setTab("premium")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      tab === "premium" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Subskrypcja
                  </button>
                  <button
                    onClick={() => setTab("support")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      tab === "support" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Wesprzyj nas ❤️
                  </button>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {FEATURES.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5 text-sm">
                      <Icon size={14} className="text-primary flex-shrink-0" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                {tab === "premium" ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                      <p className="text-2xl font-bold text-foreground">5,99 zł<span className="text-sm font-normal text-muted-foreground">/mies.</span></p>
                      <p className="text-xs text-muted-foreground mt-1">Możesz anulować w każdej chwili</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Wesprzyj twórców i otrzymaj <span className="font-semibold text-foreground">Premium na zawsze</span>! Wpłać dowolną kwotę od 5,99 zł.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {SUPPORT_AMOUNTS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSupportAmount(opt.value); setCustomAmount(""); }}
                          className={`py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer border ${
                            !customAmount && supportAmount === opt.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Inna kwota (np. 15)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">zł</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Ładowanie..." : tab === "premium" ? "Subskrybuj — 5,99 zł/mies." : `Wesprzyj — ${customAmount ? customAmount.replace(".", ",") : supportAmount.toString().replace(".", ",")} zł`}
                </button>

                <p className="text-[10px] text-muted-foreground text-center">
                  Płatność obsługiwana przez Stripe. Bezpieczna i szyfrowana.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
