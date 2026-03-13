import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, CheckCircle, ArrowLeft, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { checkSubscription, isPremium } = useSubscription();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      await new Promise((r) => setTimeout(r, 2000));
      await checkSubscription();
      setChecking(false);
    };
    verify();
  }, [checkSubscription]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md text-center space-y-6"
      >
        {/* Animated icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center relative"
        >
          <Crown size={44} className="text-primary" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
          >
            <CheckCircle size={18} className="text-primary-foreground" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Witaj w Premium! 🎉
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Dziękujemy za wsparcie! Od teraz korzystasz z pełnej wersji Eloquencee bez żadnych ograniczeń.
          </p>
        </motion.div>

        {/* Benefits reminder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-3 text-left"
        >
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            Twoje korzyści Premium
          </p>
          {[
            "Nieograniczona nauka słów",
            "Pełny dostęp do quizów i ćwiczeń",
            "AI Chat bez limitów",
            "Zaawansowane powiadomienia",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle size={14} className="text-primary flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </motion.div>

        {checking && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground"
          >
            Weryfikuję płatność...
          </motion.p>
        )}

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          <ArrowLeft size={16} />
          Wróć do nauki
        </motion.button>
      </motion.div>
    </div>
  );
}
