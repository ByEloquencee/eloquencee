import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useMemo } from "react";
import islandImg from "@/assets/island-level.png";

interface IslandLevelsPanelProps {
  title: string;
  levels?: string[]; // labels of levels, ordered from 1 → N
  onClose: () => void;
  onSelectLevel: (level: number) => void;
}

// Naprzemienne pozycje X (w procentach kontenera) dla efektu zygzaka
const X_POSITIONS = [28, 70, 32, 72, 30, 68];

// Definicje "ścieżek" między kolejnymi wyspami — niektóre robią pętelki/zakręty.
// Każdy wpis = krzywa bezier z dwoma punktami kontrolnymi (cx1,cy1,cx2,cy2)
// współrzędne w procentach (x: 0-100, y: 0-100 wewnątrz segmentu między dwiema wyspami)
type Segment = { c1x: number; c1y: number; c2x: number; c2y: number };
const SEGMENTS: Segment[] = [
  // 1 → 2: łagodny łuk w prawo
  { c1x: 80, c1y: 25, c2x: 20, c2y: 75 },
  // 2 → 3: pętelka po prawej stronie
  { c1x: 110, c1y: 30, c2x: 90, c2y: 70 },
  // 3 → 4: zakręt w lewo
  { c1x: -10, c1y: 30, c2x: 100, c2y: 70 },
  // 4 → 5: pętelka po lewej
  { c1x: -15, c1y: 40, c2x: 5, c2y: 80 },
  // 5 → 6: lekki zygzak
  { c1x: 90, c1y: 35, c2x: 10, c2y: 65 },
];

export function IslandLevelsPanel({
  title,
  levels,
  onClose,
  onSelectLevel,
}: IslandLevelsPanelProps) {
  const levelLabels = levels ?? Array.from({ length: 6 }, (_, i) => `Poziom ${i + 1}`);
  const total = levelLabels.length;

  // Wyspy w kolejności od ostatniej (na górze) do pierwszej (na dole)
  const ordered = useMemo(() => {
    return Array.from({ length: total }, (_, i) => total - i);
  }, [total]);

  const cellVh = 34; // wysokość komórki w jednostkach dvh
  const totalHeight = `calc(${total} * ${cellVh}dvh)`;

  // Buduj ścieżkę SVG przez wszystkie środki wysp (od dołu — poziom 1 — do góry)
  // Współrzędne SVG: viewBox 100 x (total*100). Y rośnie w dół, więc poziom 1 ma największe Y.
  const svgPath = useMemo(() => {
    const points = Array.from({ length: total }, (_, i) => {
      const lvl = i + 1; // 1..total
      const xIdx = (lvl - 1) % X_POSITIONS.length;
      const x = X_POSITIONS[xIdx];
      // Poziom 1 na dole: y = (total - lvl + 0.5) * 100
      const y = (total - lvl + 0.5) * 100;
      return { x, y };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const seg = SEGMENTS[i % SEGMENTS.length];
      const p1 = points[i];
      const p2 = points[i + 1];
      // Punkty kontrolne interpretujemy w lokalnym pasie [p1.y, p2.y]
      const dy = p2.y - p1.y;
      const c1x = seg.c1x;
      const c1y = p1.y + (seg.c1y / 100) * dy;
      const c2x = seg.c2x;
      const c2y = p1.y + (seg.c2y / 100) * dy;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [total]);

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

      <div
        className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
      >
        <div
          className="relative mx-auto w-full max-w-md"
          style={{
            height: totalHeight,
            paddingTop: "calc(env(safe-area-inset-top) + 64px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)",
          }}
        >
          {/* Kreskówkowa ścieżka łącząca wyspy */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 100 ${total * 100}`}
            preserveAspectRatio="none"
          >
            <path
              d={svgPath}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={0.7}
              strokeDasharray="2.5 2.5"
              strokeLinecap="round"
              opacity={0.75}
            />
          </svg>

          {/* Wyspy */}
          {ordered.map((lvl) => {
            const xIdx = (lvl - 1) % X_POSITIONS.length;
            const xPct = X_POSITIONS[xIdx];
            // Pozycja Y od góry kontenera: poziom najwyższy na górze
            const topPct = ((total - lvl) / total) * 100;
            const label = levelLabels[lvl - 1];

            return (
              <button
                key={lvl}
                onClick={() => onSelectLevel(lvl)}
                className="absolute -translate-x-1/2 group flex flex-col items-center"
                style={{
                  top: `calc(${topPct}% + ${cellVh / 2}dvh)`,
                  left: `${xPct}%`,
                  width: "44%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="relative w-full aspect-[348/279] flex items-center justify-center">
                  <img
                    src={islandImg}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-contain transition-transform duration-200 group-active:scale-95"
                    style={{
                      filter: "drop-shadow(0 8px 16px rgba(255,140,40,0.18))",
                    }}
                  />
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
                </div>
                <span
                  className="mt-1 text-white/90 text-[12px] font-semibold text-center leading-tight px-1"
                  style={{
                    fontFamily: "var(--font-display)",
                    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
