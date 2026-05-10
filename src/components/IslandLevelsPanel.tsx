import { motion } from "framer-motion";
import { X } from "lucide-react";
import islandImg from "@/assets/island-level.png";

interface IslandLevelsPanelProps {
  title: string;
  totalLevels?: number;
  onClose: () => void;
  onSelectLevel: (level: number) => void;
}

export function IslandLevelsPanel({
  title,
  totalLevels = 15,
  onClose,
  onSelectLevel,
}: IslandLevelsPanelProps) {
  // Wyspy od najwyższego (15) na górze do 1 na dole — scrollujemy w górę by odkrywać kolejne
  const levels = Array.from({ length: totalLevels }, (_, i) => totalLevels - i);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black"
    >
      {/* Nagłówek */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 bg-gradient-to-b from-black via-black/85 to-transparent">
        <h2
          className="text-white text-lg font-semibold tracking-wide"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Zamknij"
          className="h-9 w-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Lista wysp — przewijana, ostatni poziom na dole */}
      <div
        className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
      >
        <div
          className="relative mx-auto w-full max-w-md flex flex-col items-stretch"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 64px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)",
          }}
        >
          {levels.map((lvl, idx) => {
            // Naprzemiennie lewo/prawo dla efektu zygzaka
            const isRight = lvl % 2 === 0;
            const nextIsRight = (lvl - 1) % 2 === 0;
            const isLast = idx === levels.length - 1;

            return (
              <div
                key={lvl}
                className="relative w-full"
                style={{ height: "calc(100dvh / 4.5)", minHeight: 180 }}
              >
                {/* Linia łącząca z następną wyspą (tą poniżej) */}
                {!isLast && (
                  <svg
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                      top: "55%",
                      height: "55%",
                      width: "100%",
                    }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1={isRight ? 70 : 30}
                      y1={0}
                      x2={nextIsRight ? 70 : 30}
                      y2={100}
                      stroke="hsl(var(--primary))"
                      strokeWidth={0.6}
                      strokeDasharray="3 3"
                      opacity={0.7}
                    />
                  </svg>
                )}

                {/* Wyspa */}
                <button
                  onClick={() => onSelectLevel(lvl)}
                  className={`absolute top-0 ${
                    isRight ? "right-2" : "left-2"
                  } w-[55%] aspect-[348/279] flex items-center justify-center group`}
                >
                  <img
                    src={islandImg}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-contain transition-transform duration-200 group-active:scale-95"
                    style={{
                      filter: "drop-shadow(0 8px 16px rgba(255,140,40,0.18))",
                    }}
                  />
                  {/* Numer poziomu */}
                  <span
                    className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold pointer-events-none"
                    style={{
                      fontFamily: "var(--font-display)",
                      textShadow: "0 2px 6px rgba(0,0,0,0.85)",
                      transform: "translateY(8%)",
                    }}
                  >
                    {lvl}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
