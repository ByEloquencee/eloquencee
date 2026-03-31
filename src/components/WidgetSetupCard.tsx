import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, X, ChevronRight } from "lucide-react";

function WidgetInstructionsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const steps = [
    {
      title: "1. Pobierz aplikację",
      description: "Wyeksportuj projekt na GitHub, zbuduj aplikację natywną w Xcode i zainstaluj na swoim iPhonie.",
    },
    {
      title: "2. Dodaj widget",
      description: "Przytrzymaj palec na ekranie głównym → kliknij \"+\" w lewym górnym rogu → wyszukaj \"Eloquencee\".",
    },
    {
      title: "3. Wybierz rozmiar",
      description: "Wybierz mały widget z codziennym słówkiem. Kliknij \"Dodaj widget\" i umieść go na ekranie.",
    },
    {
      title: "4. Ucz się codziennie",
      description: "Widget będzie codziennie wyświetlał nowe słowo. Kliknij go, aby zobaczyć pełną definicję w aplikacji.",
    },
  ];

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
              <Smartphone size={18} className="text-primary" />
              <h2 className="text-lg font-semibold">Widget iOS</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Widget preview */}
            <div className="rounded-2xl bg-secondary/50 border border-border p-4 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Słowo dnia</p>
              <p className="text-xl font-bold text-foreground font-serif">Eloquencja</p>
              <p className="text-xs text-muted-foreground mt-1">Sztuka pięknego i przekonującego mówienia</p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.title} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-primary">{step.title.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{step.title.slice(3)}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              Widget wymaga natywnej aplikacji iOS zbudowanej z tego projektu.
            </p>

            <button
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              onClick={onClose}
            >
              Rozumiem
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function WidgetSetupCard() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors cursor-pointer text-left"
      >
        <div className="p-2 rounded-xl bg-primary/10">
          <Smartphone size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Widget na iPhone</p>
          <p className="text-xs text-muted-foreground">Codzienne słówko na ekranie głównym</p>
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </button>
      <WidgetInstructionsDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
