import { motion } from "framer-motion";
import { ChevronLeft, Lock, Check, Pencil, Database } from "lucide-react";
import { useModerator } from "@/hooks/use-moderator";

interface LevelsPanelProps {
  title: string;
  packId: string;
  totalLevels?: number;
  highestCompleted: number;
  onClose: () => void;
  onSelectLevel: (level: number) => void;
  onEditLevel?: (level: number) => void;
  onEditBase?: () => void;
}

type LevelState = "completed" | "available" | "locked";

export function LevelsPanel({
  title,
  totalLevels = 5,
  highestCompleted,
  onClose,
  onSelectLevel,
  onEditLevel,
  onEditBase,
}: LevelsPanelProps) {
  const { isModerator } = useModerator();
  const currentLevel = Math.min(highestCompleted + 1, totalLevels);
  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background"
    >
      {/* Nagłówek */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),12px)] pb-3 bg-background">
        <button
          onClick={onClose}
          aria-label="Wstecz"
          className="h-9 w-9 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h2
            className="text-foreground text-base font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
            Poziom {currentLevel} / {totalLevels}
          </span>
        </div>
        {isModerator && onEditBase ? (
          <button
            onClick={onEditBase}
            aria-label="Baza paczki"
            className="h-9 w-9 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
          >
            <Database size={18} />
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Pionowa linia czasu */}
      <div
        className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
      >
        <div
          className="relative mx-auto w-full max-w-sm px-6"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 96px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)",
          }}
        >
          <div className="relative">
            {/* Pionowa linia w tle */}
            <div
              className="absolute left-[27px] top-2 bottom-2 w-px bg-foreground/15"
              aria-hidden
            />
            {/* Wypełnienie linii do aktualnego poziomu */}
            <div
              className="absolute left-[27px] top-2 w-px bg-foreground/60 transition-all"
              style={{
                height: `calc(${
                  Math.max(0, Math.min(highestCompleted, totalLevels - 1)) /
                  (totalLevels - 1)
                } * (100% - 16px))`,
              }}
              aria-hidden
            />

            <ul className="relative space-y-7">
              {levels.map((lvl) => {
                const state: LevelState =
                  lvl <= highestCompleted
                    ? "completed"
                    : lvl === currentLevel
                    ? "available"
                    : "locked";
                return (
                  <li key={lvl} className="relative flex items-center gap-4">
                    {/* Kropka / kółko */}
                    <button
                      onClick={() => state !== "locked" && onSelectLevel(lvl)}
                      disabled={state === "locked"}
                      aria-label={`Poziom ${lvl}`}
                      className={`relative z-10 h-14 w-14 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
                        state === "completed"
                          ? "bg-foreground text-background"
                          : state === "available"
                          ? "bg-background text-foreground border-2 border-foreground"
                          : "bg-background text-muted-foreground border border-foreground/15"
                      }`}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {state === "completed" ? (
                        <Check size={22} strokeWidth={3} />
                      ) : state === "locked" ? (
                        <Lock size={18} />
                      ) : (
                        <span className="text-lg font-semibold">{lvl}</span>
                      )}
                    </button>

                    {/* Etykieta */}
                    <button
                      onClick={() => state !== "locked" && onSelectLevel(lvl)}
                      disabled={state === "locked"}
                      className="flex-1 text-left disabled:opacity-50"
                    >
                      <p
                        className="text-base text-foreground"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Poziom {lvl}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {state === "completed"
                          ? "Ukończony"
                          : state === "available"
                          ? "Do gry"
                          : "Zablokowany"}
                      </p>
                    </button>

                    {/* Edycja dla moderatorów */}
                    {isModerator && onEditLevel && (
                      <button
                        onClick={() => onEditLevel(lvl)}
                        aria-label={`Edytuj poziom ${lvl}`}
                        className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
