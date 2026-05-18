import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
  Flag,
} from "lucide-react";
import { categories, words as staticWords } from "@/data/words";
import { useGlobalWords } from "@/hooks/use-global-words";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PREMIUM_PACK_IDS } from "@/hooks/use-pack-words";

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

const fallbackWatermarks: Record<string, string[]> = {
  showbiznes: ["gala", "celebryta", "premiera", "skandal", "wywiad", "paparazzi", "rampa", "fame"],
  muzyka: ["harmonia", "rytm", "melodia", "akord", "tonacja", "fraza", "kontrapunkt", "tempo"],
  archaizmy: ["azaliż", "snadź", "wszelako", "tedy", "albowiem", "zaiste", "jeno", "atoli"],
  nauka: ["hipoteza", "atom", "teoria", "synteza", "kwant", "dowód", "entropia", "izotop"],
  sport: ["finał", "rekord", "trener", "drużyna", "puchar", "taktyka", "transfer", "kontuzja"],
  własne: ["notatka", "własne", "moje", "kolekcja", "prywatne", "zbiór"],
};

const premiumPacksMeta: Omit<WordPack, "count" | "watermarks">[] = [
  { id: "showbiznes", label: "Show-biznes", icon: Film, isPremium: true },
  { id: "muzyka", label: "Muzyka", icon: Music, isPremium: true },
  { id: "archaizmy", label: "Archaizmy", icon: Scroll, isPremium: true },
  { id: "nauka", label: "Nauka", icon: FlaskConical, isPremium: true },
  { id: "sport", label: "Sport", icon: Trophy, isPremium: true },
];

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

interface WordPacksPanelProps {
  onSelectPack?: (packId: string, label: string) => void;
  onOpenPremium?: () => void;
}

const FLAGS_PACK: WordPack = {
  id: "flagi",
  label: "Flagi",
  icon: Flag,
  isPremium: false,
  watermarks: ["Polska", "Niemcy", "Francja", "Włochy", "Hiszpania", "Japonia", "Brazylia", "Kanada", "Egipt", "Indie", "Chiny", "Meksyk"],
  count: 130,
};

export function WordPacksPanel({ onSelectPack, onOpenPremium }: WordPacksPanelProps = {}) {
  const { asPolishWords } = useGlobalWords();
  const { isPremium } = useSubscription();
  const { user } = useAuth();
  const [progressByPack, setProgressByPack] = useState<Record<string, number>>({});
  const [premiumCounts, setPremiumCounts] = useState<Record<string, number>>({});

  // Pobierz progres dla wszystkich paczek
  useEffect(() => {
    if (!user) { setProgressByPack({}); return; }
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from("pack_progress")
        .select("pack_id")
        .eq("user_id", user.id);
      if (cancel) return;
      const counts: Record<string, number> = {};
      (data || []).forEach((r) => { counts[r.pack_id] = (counts[r.pack_id] || 0) + 1; });
      setProgressByPack(counts);
    })();
    return () => { cancel = true; };
  }, [user]);

  // Pobierz liczbę słów w paczkach premium
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from("pack_premium_words")
        .select("pack_id");
      if (cancel) return;
      const counts: Record<string, number> = {};
      (data || []).forEach((r) => { counts[r.pack_id] = (counts[r.pack_id] || 0) + 1; });
      setPremiumCounts(counts);
    })();
    return () => { cancel = true; };
  }, []);

  const packs = useMemo<WordPack[]>(() => {
    const allWords = [...staticWords, ...asPolishWords];
    const byCategory = new Map<string, string[]>();
    for (const w of allWords) {
      if (!w.category) continue;
      const arr = byCategory.get(w.category) || [];
      arr.push(w.word);
      byCategory.set(w.category, arr);
    }

    const basePacks: WordPack[] = categories
      .filter((c) => c.value !== "all" && c.value !== "ciekawi_ludzie" && c.value !== "własne")
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
      count: premiumCounts[p.id] || 0,
    }));

    const withFlags = [...basePacks];
    withFlags.splice(1, 0, FLAGS_PACK);
    return [...withFlags, ...premiumPacks];
  }, [asPolishWords, premiumCounts]);

  const handleClick = (pack: WordPack) => {
    if (pack.isPremium && !isPremium) {
      onOpenPremium?.();
      return;
    }
    if (pack.count === 0 && pack.id !== "flagi") {
      toast.info("Ta paczka jest jeszcze pusta — wkrótce dodamy słowa!");
      return;
    }
    onSelectPack?.(pack.id, pack.label);
  };

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
          const masteredCount = progressByPack[pack.id] || 0;
          const pct = pack.count > 0 ? Math.min(100, Math.round((masteredCount / pack.count) * 100)) : 0;
          const locked = pack.isPremium && !isPremium;

          return (
            <motion.button
              key={pack.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleClick(pack)}
              className={`relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group text-left ring-1 ring-primary/15 hover:ring-primary/40 transition-all bg-[#1a1a1a] ${
                locked ? "opacity-70" : ""
              }`}
            >
              {/* Watermark */}
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

              <div className="absolute inset-0 flex items-center justify-center pb-16">
                <Icon
                  size={88}
                  strokeWidth={1.25}
                  className="text-primary transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {pack.isPremium && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Crown size={11} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Premium</span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
                <span
                  className="block text-white text-xl font-bold leading-tight drop-shadow-md"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {pack.label}
                </span>
                <div className="flex items-center gap-2">
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

// Re-export pomocniczy
export { PREMIUM_PACK_IDS };
