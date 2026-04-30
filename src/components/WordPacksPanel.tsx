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

// Bierze pierwszych ~15 słów i powtarza je, żeby wypełnić linijki tła
function buildWatermarkPool(words: string[], poolSize = 15): string[] {
  if (words.length === 0) return [];
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const w of words) {
    const k = w.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(w);
    if (unique.length >= poolSize) break;
  }
  return unique;
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
          const pool = buildWatermarkPool(pack.watermarks, 15);
          const rows = 14;

          return (
            <motion.button
              key={pack.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group text-left ring-1 ring-primary/15 hover:ring-primary/40 transition-all bg-[#1a1a1a]"
            >
              {/* Znaki wodne — równe linijki, ~15 słów powtarzanych w kółko */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none select-none flex flex-col justify-between py-2 px-1">
                {pool.length > 0 &&
                  Array.from({ length: rows }).map((_, rowIdx) => {
                    const lineWords: string[] = [];
                    for (let k = 0; k < 6; k++) {
                      lineWords.push(pool[(rowIdx * 3 + k) % pool.length]);
                    }
                    return (
                      <div
                        key={rowIdx}
                        className="whitespace-nowrap text-primary font-semibold leading-none"
                        style={{
                          fontSize: "11px",
                          fontFamily: "var(--font-display)",
                          opacity: 0.06,
                        }}
                      >
                        {lineWords.join("  ·  ")}
                      </div>
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
