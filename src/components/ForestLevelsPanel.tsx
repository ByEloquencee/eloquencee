import { motion } from "framer-motion";
import { ChevronLeft, Lock, Check, Star } from "lucide-react";

interface ForestLevelsPanelProps {
  title: string;
  totalLevels?: number;
  highestCompleted: number; // 0 = nic nie zaliczone, dostępny poziom 1
  onClose: () => void;
  onSelectLevel: (level: number) => void;
}

// ─── Minimalistyczne grafiki leśne (SVG) ───
const FOREST_PALETTE = {
  trunk: "hsl(var(--foreground) / 0.55)",
  leaf: "hsl(var(--primary) / 0.55)",
  leafSoft: "hsl(var(--primary) / 0.35)",
  ground: "hsl(var(--foreground) / 0.25)",
};

function PineTree({ size = 56, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ opacity }}>
      <polygon points="32,8 48,32 16,32" fill={FOREST_PALETTE.leaf} />
      <polygon points="32,20 50,44 14,44" fill={FOREST_PALETTE.leafSoft} />
      <rect x="29" y="44" width="6" height="10" fill={FOREST_PALETTE.trunk} rx="1" />
    </svg>
  );
}

function Bush({ size = 40, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 64 44" style={{ opacity }}>
      <ellipse cx="20" cy="28" rx="14" ry="12" fill={FOREST_PALETTE.leafSoft} />
      <ellipse cx="42" cy="26" rx="16" ry="14" fill={FOREST_PALETTE.leaf} />
      <ellipse cx="32" cy="22" rx="12" ry="10" fill={FOREST_PALETTE.leafSoft} />
    </svg>
  );
}

function Mushroom({ size = 28, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ opacity }}>
      <path d="M4 16 Q4 6 16 6 Q28 6 28 16 Z" fill={FOREST_PALETTE.leaf} />
      <circle cx="12" cy="12" r="1.5" fill="hsl(var(--background))" />
      <circle cx="20" cy="11" r="1" fill="hsl(var(--background))" />
      <rect x="13" y="16" width="6" height="10" fill={FOREST_PALETTE.trunk} rx="1" />
    </svg>
  );
}

function Stick({ size = 36, opacity = 1, rotate = 0 }: { size?: number; opacity?: number; rotate?: number }) {
  return (
    <svg width={size} height={size * 0.4} viewBox="0 0 48 20" style={{ opacity, transform: `rotate(${rotate}deg)` }}>
      <line x1="4" y1="14" x2="44" y2="6" stroke={FOREST_PALETTE.trunk} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="9" x2="26" y2="2" stroke={FOREST_PALETTE.trunk} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Pebble({ size = 16, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 32 20" style={{ opacity }}>
      <ellipse cx="16" cy="12" rx="14" ry="6" fill={FOREST_PALETTE.ground} />
    </svg>
  );
}

// Deterministyczne dekoracje wokół poziomu (na podstawie numeru)
function decorationsForLevel(lvl: number, isRight: boolean) {
  // Prosta hash-funkcja pseudo-random, ale stabilna
  const r = (n: number) => {
    const x = Math.sin(lvl * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  // 2-4 elementy wokół, niektóre z lewej, niektóre z prawej
  const items: { type: "pine" | "bush" | "mushroom" | "stick" | "pebble"; left: string; top: string; size: number; opacity: number; rotate?: number }[] = [];
  const types: Array<"pine" | "bush" | "mushroom" | "stick" | "pebble"> = ["pine", "bush", "mushroom", "stick", "pebble"];

  // Po przeciwnej stronie wyspy — większy element
  items.push({
    type: r(1) > 0.5 ? "pine" : "bush",
    left: isRight ? "8%" : "auto",
    top: "30%",
    size: 56 + Math.floor(r(2) * 10),
    opacity: 0.9,
  } as any);
  if (!isRight) (items[0] as any).right = "8%";

  // Mały dół
  items.push({
    type: r(3) > 0.6 ? "mushroom" : "stick",
    left: isRight ? "30%" : "55%",
    top: "70%",
    size: 28 + Math.floor(r(4) * 10),
    opacity: 0.85,
    rotate: Math.floor(r(5) * 60 - 30),
  });

  // Drobny kamyk
  if (r(6) > 0.4) {
    items.push({
      type: "pebble",
      left: isRight ? "65%" : "20%",
      top: "82%",
      size: 18 + Math.floor(r(7) * 10),
      opacity: 0.7,
    });
  }

  // Czasem dodatkowe drzewko po drugiej stronie góry
  if (r(8) > 0.55) {
    items.push({
      type: "pine",
      left: isRight ? "70%" : "20%",
      top: "10%",
      size: 36 + Math.floor(r(9) * 10),
      opacity: 0.65,
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
    "relative h-16 w-16 rounded-full flex items-center justify-center font-bold transition-transform";
  const ring =
    state === "available"
      ? "ring-4 ring-primary/30"
      : state === "completed"
      ? "ring-2 ring-primary/40"
      : "ring-1 ring-foreground/10";
  const bg =
    state === "completed"
      ? "bg-primary text-primary-foreground"
      : state === "available"
      ? "bg-card text-foreground border-2 border-primary"
      : "bg-secondary/40 text-muted-foreground";

  return (
    <motion.button
      whileTap={{ scale: state === "locked" ? 1 : 0.9 }}
      onClick={onClick}
      disabled={state === "locked"}
      aria-label={`Poziom ${lvl}`}
      className={`${base} ${ring} ${bg}`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {state === "completed" ? (
        <Check size={26} strokeWidth={3} />
      ) : state === "locked" ? (
        <Lock size={22} />
      ) : (
        <span className="text-xl">{lvl}</span>
      )}

      {/* delikatny pulse dla aktualnego poziomu */}
      {state === "available" && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-primary"
          animate={{ scale: [1, 1.25], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* Ostatni poziom — gwiazdka nad nim */}
      {lvl === 15 && (
        <Star
          size={14}
          className="absolute -top-2 -right-1 text-primary fill-primary"
        />
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
  // Od najwyższego (15) na górze do 1 na dole
  const levels = Array.from({ length: totalLevels }, (_, i) => totalLevels - i);
  const currentLevel = Math.min(highestCompleted + 1, totalLevels);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background"
    >
      {/* Tło: subtelny gradient leśny */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, hsl(var(--primary) / 0.08), transparent 60%), radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.05), transparent 50%)",
        }}
      />

      {/* Nagłówek */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),12px)] pb-3 bg-gradient-to-b from-background via-background/90 to-transparent">
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
            const decorations = decorationsForLevel(lvl, isRight);

            return (
              <div
                key={lvl}
                className="relative w-full"
                style={{ height: "calc(100dvh / 4.2)", minHeight: 170 }}
              >
                {/* Dekoracje leśne wokół poziomu */}
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
                        : Pebble;
                    return (
                      <div
                        key={i}
                        className="absolute"
                        style={{
                          left: (d as any).left,
                          right: (d as any).right,
                          top: d.top,
                          opacity: state === "locked" ? d.opacity * 0.45 : d.opacity,
                          filter: state === "locked" ? "grayscale(0.6)" : undefined,
                        }}
                      >
                        <Comp size={d.size} opacity={1} {...(d.type === "stick" ? { rotate: (d as any).rotate } : {})} />
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
                      stroke="hsl(var(--primary))"
                      strokeWidth={0.5}
                      strokeDasharray="2.5 3"
                      opacity={lvl <= highestCompleted + 1 ? 0.55 : 0.2}
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
          <div className="relative mt-2 flex items-center justify-center gap-3 opacity-70">
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
