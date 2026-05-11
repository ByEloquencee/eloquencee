import { motion } from "framer-motion";
import { ChevronLeft, Lock, Check, Star } from "lucide-react";

interface ForestLevelsPanelProps {
  title: string;
  totalLevels?: number;
  highestCompleted: number;
  onClose: () => void;
  onSelectLevel: (level: number) => void;
}

// ─── Hand-drawn ikonki (kremowy outline) ───
const INK = "hsl(var(--foreground) / 0.75)";
const STROKE = 2.2;

// Pine tree — chunky, warstwowa
function PineTree({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 64 74" fill="none">
      <path
        d="M32 6 C28 14 24 18 20 22 C24 22 26 22 28 21 C24 28 20 32 16 36 C20 36 24 36 27 35 C23 42 18 46 13 50 C19 50 26 50 32 50 C38 50 45 50 51 50 C46 46 41 42 37 35 C40 36 44 36 48 36 C44 32 40 28 36 21 C38 22 40 22 44 22 C40 18 36 14 32 6 Z"
        stroke={INK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M28 50 L28 60 M36 50 L36 60 M28 60 L36 60" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// Krzak / bush — chmurkowy z żyłkami
function Bush({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.78} viewBox="0 0 64 50" fill="none">
      <path
        d="M6 40 C4 28 12 22 18 24 C18 14 30 12 34 18 C40 10 52 14 52 22 C60 22 62 34 56 40 C56 44 50 46 46 44 C40 46 34 44 32 42 C28 46 20 46 14 44 C10 46 6 44 6 40 Z"
        stroke={INK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M22 40 L22 28 M32 42 L32 24 M44 42 L44 28" stroke={INK} strokeWidth={STROKE * 0.7} strokeLinecap="round"/>
    </svg>
  );
}

// Pojedynczy grzyb
function Mushroom({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 32 36" fill="none">
      <path d="M4 16 C4 8 12 4 16 4 C22 4 28 9 28 16 C28 18 26 18 24 18 L8 18 C6 18 4 18 4 16 Z" stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" fill="none"/>
      <path d="M12 18 L12 30 C12 32 14 33 16 33 C18 33 20 32 20 30 L20 18" stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" fill="none"/>
      <circle cx="14" cy="11" r="1.4" fill={INK}/>
      <circle cx="20" cy="13" r="1" fill={INK}/>
    </svg>
  );
}

// Para grzybów
function MushroomPair({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 48 44" fill="none">
      <path d="M2 18 C2 10 9 6 13 6 C19 6 24 11 24 18 C24 20 22 20 20 20 L6 20 C4 20 2 20 2 18 Z" stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" fill="none"/>
      <path d="M9 20 L9 32 C9 34 11 35 13 35 C15 35 17 34 17 32 L17 20" stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" fill="none"/>
      <path d="M24 26 C24 20 30 18 33 18 C38 18 42 21 42 26 C42 28 40 28 38 28 L26 28 C25 28 24 28 24 26 Z" stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" fill="none"/>
      <path d="M30 28 L30 38 C30 40 32 41 33 41 C35 41 36 40 36 38 L36 28" stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// Trawa — kępka
function Grass({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 36 26" fill="none">
      <path d="M4 24 C5 16 7 10 9 4 M9 4 C10 10 11 16 11 24" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" fill="none"/>
      <path d="M14 24 C16 14 18 8 20 2 M20 2 C21 10 22 16 22 24" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" fill="none"/>
      <path d="M25 24 C26 16 28 10 30 6 M30 6 C30 12 31 18 32 24" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// Patyk z listkami
function LeafSprig({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 40 28" fill="none">
      <path d="M4 24 Q14 16 36 6" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" fill="none"/>
      <path d="M14 18 Q10 12 16 10 Q20 14 14 18 Z" stroke={INK} strokeWidth={STROKE * 0.85} strokeLinejoin="round" fill="none"/>
      <path d="M22 12 Q18 6 24 4 Q28 8 22 12 Z" stroke={INK} strokeWidth={STROKE * 0.85} strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// Kamyki (3 owale)
function Pebbles({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 40 22" fill="none">
      <ellipse cx="8" cy="14" rx="6" ry="4" stroke={INK} strokeWidth={STROKE * 0.85} fill="none"/>
      <ellipse cx="22" cy="11" rx="7" ry="4.5" stroke={INK} strokeWidth={STROKE * 0.85} fill="none"/>
      <ellipse cx="34" cy="15" rx="4" ry="3" stroke={INK} strokeWidth={STROKE * 0.85} fill="none"/>
    </svg>
  );
}

// Kłoda / bal
function Log({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 48 24" fill="none">
      <rect x="4" y="6" width="40" height="14" rx="4" stroke={INK} strokeWidth={STROKE} fill="none"/>
      <ellipse cx="8" cy="13" rx="3.5" ry="5" stroke={INK} strokeWidth={STROKE * 0.85} fill="none"/>
      <circle cx="8" cy="13" r="1.5" stroke={INK} strokeWidth={STROKE * 0.7} fill="none"/>
    </svg>
  );
}

// Pojedynczy patyk
function Stick({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.4} viewBox="0 0 44 18" fill="none">
      <path d="M3 14 L40 4" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" fill="none"/>
      <path d="M18 10 L24 4" stroke={INK} strokeWidth={STROKE * 0.85} strokeLinecap="round" fill="none"/>
      <circle cx="3" cy="14" r="1.4" fill={INK}/>
    </svg>
  );
}

// Liść dębu
function OakLeaf({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 4 C12 6 8 8 6 12 C8 14 8 14 6 16 C8 18 8 18 6 20 C10 24 14 26 16 28 C18 26 22 24 26 20 C24 18 24 18 26 16 C24 14 24 14 26 12 C24 8 20 6 16 4 Z" stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" fill="none"/>
      <path d="M16 6 L16 28" stroke={INK} strokeWidth={STROKE * 0.7} strokeLinecap="round"/>
    </svg>
  );
}

type DecoType = "pine" | "bush" | "mushroom" | "mushroomPair" | "grass" | "leafSprig" | "pebbles" | "log" | "stick" | "oakLeaf";

interface Deco {
  type: DecoType;
  left?: string;
  right?: string;
  top: string;
  size: number;
  rotate: number;
}

function decorationsForLevel(lvl: number): Deco[] {
  const r = (n: number) => {
    const x = Math.sin(lvl * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  // Większość to drzewa, reszta wypełnia
  const weighted: DecoType[] = [
    "pine","pine","pine","pine","pine","pine","pine","pine","pine","pine","pine","pine",
    "bush","bush","bush","bush",
    "mushroom","mushroomPair",
    "grass","grass",
    "leafSprig","pebbles","stick","log","oakLeaf",
  ];
  const items: Deco[] = [];

  const nodeRight = lvl % 2 === 0;
  const nodeHoriz = 15;
  const nodeTop = 15;
  const nodeRadius = 16;

  // BARDZO dużo: 30-40 elementów
  const count = 30 + Math.floor(r(0) * 11);

  let placed = 0;
  let attempt = 0;
  while (placed < count && attempt < count * 8) {
    attempt++;
    const type = weighted[Math.floor(r(attempt * 11 + 1) * weighted.length)];
    const useLeft = r(attempt * 7 + 2) > 0.5;
    const horizPct = -2 + Math.floor(r(attempt * 13 + 4) * 96);
    const vertPct = 2 + Math.floor(r(attempt * 17 + 5) * 92);

    const sameSideAsNode = useLeft !== nodeRight;
    if (sameSideAsNode) {
      const dh = Math.abs(horizPct - nodeHoriz);
      const dv = Math.abs(vertPct - nodeTop);
      if (dh < nodeRadius && dv < nodeRadius) continue;
    }

    const baseSize =
      type === "pine" ? 56 :
      type === "bush" ? 44 :
      type === "mushroomPair" ? 36 :
      type === "mushroom" ? 26 :
      type === "grass" ? 30 :
      type === "leafSprig" ? 32 :
      type === "log" ? 40 :
      type === "stick" ? 36 :
      type === "oakLeaf" ? 24 :
      28;
    const size = Math.floor(baseSize * (0.7 + r(attempt * 19 + 6) * 0.7));
    const rotate =
      type === "pine"
        ? Math.floor(r(attempt * 23 + 7) * 10 - 5)
        : type === "grass" || type === "mushroom" || type === "mushroomPair"
        ? Math.floor(r(attempt * 23 + 7) * 8 - 4)
        : Math.floor(r(attempt * 23 + 7) * 60 - 30);

    items.push({
      type,
      ...(useLeft ? { left: `${horizPct}%` } : { right: `${horizPct}%` }),
      top: `${vertPct}%`,
      size,
      rotate,
    });
    placed++;
  }
  return items;
}

const DECO_COMPONENTS: Record<DecoType, React.FC<{ size?: number }>> = {
  pine: PineTree,
  bush: Bush,
  mushroom: Mushroom,
  mushroomPair: MushroomPair,
  grass: Grass,
  leafSprig: LeafSprig,
  pebbles: Pebbles,
  log: Log,
  stick: Stick,
  oakLeaf: OakLeaf,
};

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
    "relative h-14 w-14 rounded-full flex items-center justify-center font-bold transition-transform z-10";
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
        <div className="w-9" />
      </div>

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
                style={{ height: "calc(100dvh / 4.2)", minHeight: 190 }}
              >
                <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                  {decorations.map((d, i) => {
                    const Comp = DECO_COMPONENTS[d.type];
                    return (
                      <div
                        key={i}
                        className="absolute"
                        style={{
                          left: d.left,
                          right: d.right,
                          top: d.top,
                          transform: `rotate(${d.rotate}deg)`,
                          opacity: state === "locked" ? 0.45 : 0.92,
                        }}
                      >
                        <Comp size={d.size} />
                      </div>
                    );
                  })}
                </div>

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
