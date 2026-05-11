import { motion } from "framer-motion";
import { ChevronLeft, Lock, Check, Star } from "lucide-react";

interface ForestLevelsPanelProps {
  title: string;
  totalLevels?: number;
  highestCompleted: number; // 0 = nic nie zaliczone, dostępny poziom 1
  onClose: () => void;
  onSelectLevel: (level: number) => void;
}

// ─── Proste, niesymetryczne grafiki (jednokolorowy outline) ───
const INK = "hsl(var(--foreground) / 0.5)";
const INK_SOFT = "hsl(var(--foreground) / 0.32)";

function PineTree({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M30 8 L20 28 L26 28 L17 44 L26 44 L19 56 L43 56 L37 44 L46 44 L38 28 L43 28 Z"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Bush({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 64 44" fill="none">
      <path
        d="M6 36 Q4 22 16 20 Q20 8 32 12 Q42 6 50 16 Q62 18 58 32 Q56 38 50 38 L10 38 Z"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Mushroom({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M5 16 Q6 7 17 7 Q27 8 28 16 Z" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 16 L13 26 Q16 28 19 26 L18 16" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function Stick({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.45} viewBox="0 0 48 22" fill="none">
      <path d="M3 16 L44 5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 11 L29 4" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Pebble({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 32 18" fill="none">
      <path
        d="M4 13 Q3 4 14 5 Q26 4 28 11 Q24 16 14 15 Q6 16 4 13 Z"
        stroke={INK_SOFT}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LeafCluster({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 32 22" fill="none">
      <path d="M4 18 Q2 8 12 6 Q16 14 8 18" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M18 18 Q20 6 28 8 Q26 18 18 18" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

type DecoType = "pine" | "bush" | "mushroom" | "stick" | "pebble" | "leaf";

interface Deco {
  type: DecoType;
  left?: string;
  right?: string;
  top: string;
  size: number;
  rotate: number;
}

// Niesymetryczne, deterministyczne dekoracje — różna liczba i pozycje per poziom
function decorationsForLevel(lvl: number): Deco[] {
  const r = (n: number) => {
    const x = Math.sin(lvl * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  const allTypes: DecoType[] = ["pine", "bush", "mushroom", "stick", "pebble", "leaf"];
  const items: Deco[] = [];
  // 2-5 elementów rozrzuconych nieregularnie
  const count = 2 + Math.floor(r(0) * 4);

  for (let i = 0; i < count; i++) {
    const type = allTypes[Math.floor(r(i * 2 + 1) * allTypes.length)];
    const useLeft = r(i * 2 + 2) > 0.5;
    const horiz = `${5 + Math.floor(r(i * 3 + 4) * 78)}%`;
    const vert = `${4 + Math.floor(r(i * 3 + 5) * 84)}%`;
    const baseSize =
      type === "pine" ? 46 : type === "bush" ? 38 : type === "stick" ? 40 : type === "leaf" ? 22 : type === "mushroom" ? 22 : 18;
    const size = Math.floor(baseSize * (0.7 + r(i * 3 + 6) * 0.7));
    const rotate = Math.floor(r(i * 3 + 7) * 50 - 25);

    items.push({
      type,
      ...(useLeft ? { left: horiz } : { right: horiz }),
      top: vert,
      size,
      rotate,
    });
  }
  return items;
}

function LevelNode({
  lvl,
  state,
  onClick,
}: {
  lvl: number;
  state: "completed" | "available" | "locked";
  onClick: () => void;
}) {
  const base =
    "relative h-14 w-14 rounded-full flex items-center justify-center font-bold transition-transform";
  const bg =
    state === "completed"
      ? "bg-primary text-primary-foreground"
      : state === "available"
      ? "bg-card text-foreground border-2 border-primary"
      : "bg-secondary/40 text-muted-foreground border border-foreground/10";

  return (
    <motion.button
      whileTap={{ scale: state === "locked" ? 1 : 0.9 }}
      onClick={onClick}
      disabled={state === "locked"}
      aria-label={`Poziom ${lvl}`}
      className={`${base} ${bg}`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {state === "completed" ? (
        <Check size={24} strokeWidth={3} />
      ) : state === "locked" ? (
        <Lock size={20} />
      ) : (
        <span className="text-lg">{lvl}</span>
      )}

      {lvl === 15 && (
        <Star size={12} className="absolute -top-1.5 -right-1 text-primary fill-primary" />
      )}
    </motion.button>
  );
}

export function ForestLevelsPanel({
  title,
  totalLevels = 15,
  highestCompleted,
  onClose,
  onSelectLevel,
}: ForestLevelsPanelProps) {
  const levels = Array.from({ length: totalLevels }, (_, i) => totalLevels - i);
  const currentLevel = Math.min(highestCompleted + 1, totalLevels);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background"
    >
      {/* Nagłówek */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),12px)] pb-3 bg-background">
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
        <div className="w-9" />
      </div>

      {/* Mapa poziomów — przewijana */}
      <div
        className="absolute inset-0 overflow-y-auto"
        style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
      >
        <div
          className="relative mx-auto w-full max-w-md"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 70px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 60px)",
          }}
        >
          {levels.map((lvl, idx) => {
            const isRight = lvl % 2 === 0;
            const nextIsRight = (lvl - 1) % 2 === 0;
            const isLast = idx === levels.length - 1;
            const state: "completed" | "available" | "locked" =
              lvl <= highestCompleted ? "completed" : lvl === currentLevel ? "available" : "locked";
            const decorations = decorationsForLevel(lvl);

            return (
              <div
                key={lvl}
                className="relative w-full"
                style={{ height: "calc(100dvh / 4.2)", minHeight: 170 }}
              >
                {/* Dekoracje — rozrzucone, asymetryczne, tylko kontur */}
                <div className="absolute inset-0 pointer-events-none select-none">
                  {decorations.map((d, i) => {
                    const Comp =
                      d.type === "pine"
                        ? PineTree
                        : d.type === "bush"
                        ? Bush
                        : d.type === "mushroom"
                        ? Mushroom
                        : d.type === "stick"
                        ? Stick
                        : d.type === "leaf"
                        ? LeafCluster
                        : Pebble;
                    return (
                      <div
                        key={i}
                        className="absolute"
                        style={{
                          left: d.left,
                          right: d.right,
                          top: d.top,
                          transform: `rotate(${d.rotate}deg)`,
                          opacity: state === "locked" ? 0.4 : 0.85,
                        }}
                      >
                        <Comp size={d.size} />
                      </div>
                    );
                  })}
                </div>

                {/* Linia łącząca z następną wyspą (poniżej) */}
                {!isLast && (
                  <svg
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{ top: "55%", height: "55%", width: "100%" }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1={isRight ? 75 : 25}
                      y1={0}
                      x2={nextIsRight ? 75 : 25}
                      y2={100}
                      stroke="hsl(var(--foreground))"
                      strokeWidth={0.4}
                      strokeDasharray="2 3"
                      opacity={lvl <= highestCompleted + 1 ? 0.4 : 0.15}
                    />
                  </svg>
                )}

                {/* Węzeł poziomu */}
                <div
                  className={`absolute top-[15%] ${
                    isRight ? "right-[15%]" : "left-[15%]"
                  }`}
                >
                  <LevelNode
                    lvl={lvl}
                    state={state}
                    onClick={() => state !== "locked" && onSelectLevel(lvl)}
                  />
                </div>
              </div>
            );
          })}

          {/* Stopka — linia gruntu / start */}
          <div className="relative mt-2 flex items-center justify-center gap-3 opacity-60">
            <div className="h-px flex-1 bg-foreground/15" />
            <span
              className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Start
            </span>
            <div className="h-px flex-1 bg-foreground/15" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
