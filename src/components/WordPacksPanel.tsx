import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  Crown,
  BookOpen,
  Brain,
  Users,
  Briefcase,
  Church,
  Landmark,
  Palette,
  Music,
  Film,
  Scroll,
  FlaskConical,
  Trophy,
  Globe,
  Heart,
  Lightbulb,
  Stethoscope,
} from "lucide-react";
import { categories, words as staticWords } from "@/data/words";
import { useGlobalWords } from "@/hooks/use-global-words";

interface WordPack {
  id: string;
  label: string;
  icon: typeof BookOpen;
  isPremium: boolean;
  watermarks: string[];
  count: number;
}

const categoryIcons: Record<string, typeof BookOpen> = {
  filozofia: Brain,
  literatura: BookOpen,
  psychologia: Lightbulb,
  ciekawi_ludzie: Users,
  biznes_finanse: Briefcase,
  religia: Church,
  historia: Landmark,
  sztuka: Palette,
  ogólne: Globe,
  medycyna: Stethoscope,
  własne: Heart,
};

// Fallbacki dla paczek premium (jeszcze nie mają słów w bazie)
const fallbackWatermarks: Record<string, string[]> = {
  showbiznes: ["gala", "celebryta", "premiera", "skandal", "wywiad", "paparazzi", "rampa", "fame"],
  muzyka: ["harmonia", "rytm", "melodia", "akord", "tonacja", "fraza", "kontrapunkt", "tempo"],
  archaizmy: ["azaliż", "snadź", "wszelako", "tedy", "albowiem", "zaiste", "jeno", "atoli"],
  nauka: ["hipoteza", "atom", "teoria", "synteza", "kwant", "dowód", "entropia", "izotop"],
  sport: ["finał", "rekord", "trener", "drużyna", "puchar", "taktyka", "transfer", "kontuzja"],
  medycyna: ["diagnoza", "terapia", "objaw", "zabieg", "anatomia", "leczenie", "remisja", "patogen"],
  własne: ["notatka", "własne", "moje", "kolekcja", "prywatne", "zbiór"],
};

const premiumPacksMeta: Omit<WordPack, "count" | "watermarks">[] = [
  { id: "showbiznes", label: "Show-biznes", icon: Film, isPremium: true },
  { id: "muzyka", label: "Muzyka", icon: Music, isPremium: true },
  { id: "archaizmy", label: "Archaizmy", icon: Scroll, isPremium: true },
  { id: "nauka", label: "Nauka", icon: FlaskConical, isPremium: true },
  { id: "sport", label: "Sport", icon: Trophy, isPremium: true },
];

// Deterministyczny hash z id, żeby pozycje były stałe per paczka
function hash(str: string, seed = 0): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Generuje ~15 pozycji znaków wodnych w różnych konfiguracjach (deterministycznie)
function generateWatermarkPositions(packId: string, count: number) {
  const positions: { top: string; left: string; rotate: number; size: number; opacity: number }[] = [];
  for (let i = 0; i < count; i++) {
    const h1 = hash(packId, i * 7 + 3);
    const h2 = hash(packId, i * 11 + 5);
    const h3 = hash(packId, i * 13 + 9);
    const h4 = hash(packId, i * 17 + 1);
    positions.push({
      top: `${(h1 % 90) + 2}%`,
      left: `${(h2 % 75) + 2}%`,
      rotate: ((h3 % 41) - 20), // -20°..+20°
      size: 9 + (h4 % 6),       // 9..14 px
      opacity: 0.5 + ((h1 % 50) / 100), // 0.5..1.0 mnożnik dodatkowy
    });
  }
  return positions;
}

export function WordPacksPanel() {
  const { asPolishWords } = useGlobalWords();

  const packs = useMemo<WordPack[]>(() => {
    // Połącz słowa statyczne z bazy danych
    const allWords = [...staticWords, ...asPolishWords];
    const byCategory = new Map<string, string[]>();
    for (const w of allWords) {
      if (!w.category) continue;
      const arr = byCategory.get(w.category) || [];
      arr.push(w.word);
      byCategory.set(w.category, arr);
    }

    const basePacks: WordPack[] = categories
      .filter((c) => c.value !== "all")
      .map((c) => {
        const wordsInCat = byCategory.get(c.value) || [];
        const watermarks = wordsInCat.length > 0
          ? wordsInCat
          : (fallbackWatermarks[c.value] || ["słowo", "język", "myśl"]);
        return {
          id: c.value,
          label: c.label,
          icon: categoryIcons[c.value] || BookOpen,
          isPremium: false,
          watermarks,
          count: wordsInCat.length,
        };
      });

    const premiumPacks: WordPack[] = premiumPacksMeta.map((p) => ({
      ...p,
      watermarks: fallbackWatermarks[p.id] || ["słowo"],
      count: 0,
    }));

    return [...basePacks, ...premiumPacks];
  }, [asPolishWords]);

  return (
    <div className="w-full max-w-lg space-y-4 pb-4">
      <div className="px-1">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Paczki słów
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tematyczne zestawy słów do nauki
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {packs.map((pack, i) => {
          const Icon = pack.icon;
          const positions = generateWatermarkPositions(pack.id, 15);

          return (
            <motion.button
              key={pack.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group text-left ring-1 ring-primary/15 hover:ring-primary/40 transition-all bg-[#1a1a1a]"
            >
              {/* Znaki wodne — ~15 słów w różnych konfiguracjach (rotacja, rozmiar, pozycja) */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                {positions.map((pos, idx) => {
                  const word = pack.watermarks[idx % pack.watermarks.length];
                  if (!word) return null;
                  return (
                    <span
                      key={idx}
                      className="absolute whitespace-nowrap font-semibold leading-none text-primary"
                      style={{
                        top: pos.top,
                        left: pos.left,
                        transform: `rotate(${pos.rotate}deg)`,
                        fontSize: `${pos.size}px`,
                        fontFamily: "var(--font-display)",
                        opacity: 0.07 * pos.opacity, // znacznie mniejszy kontrast (~0.035–0.07)
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>

              {/* Duża ikona pomarańczowa */}
              <div className="absolute inset-0 flex items-center justify-center pb-14">
                <Icon
                  size={88}
                  strokeWidth={1.25}
                  className="text-primary transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {/* Premium badge */}
              {pack.isPremium && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Crown size={11} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Premium</span>
                </div>
              )}

              {/* Tytuł + licznik — większa nazwa kategorii */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <span
                  className="block text-white text-xl font-bold leading-tight drop-shadow-md"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {pack.label}
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-0.5 w-8 bg-primary rounded-full" />
                  <span className="text-[11px] font-semibold text-primary/90">
                    {pack.count} słów
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
