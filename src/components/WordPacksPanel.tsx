import { motion } from "framer-motion";
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
} from "lucide-react";
import { categories } from "@/data/words";

interface WordPack {
  id: string;
  label: string;
  icon: typeof BookOpen;
  isPremium: boolean;
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
  własne: Heart,
};

const premiumPacks: WordPack[] = [
  { id: "showbiznes", label: "Show-biznes", icon: Film, isPremium: true },
  { id: "muzyka", label: "Muzyka", icon: Music, isPremium: true },
  { id: "archaizmy", label: "Archaizmy", icon: Scroll, isPremium: true },
  { id: "nauka", label: "Nauka", icon: FlaskConical, isPremium: true },
  { id: "sport", label: "Sport", icon: Trophy, isPremium: true },
];

export function WordPacksPanel() {
  const basePacks: WordPack[] = categories
    .filter((c) => c.value !== "all")
    .map((c) => ({
      id: c.value,
      label: c.label,
      icon: categoryIcons[c.value] || BookOpen,
      isPremium: false,
    }));

  const allPacks = [...basePacks, ...premiumPacks];

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
        {allPacks.map((pack, i) => {
          const Icon = pack.icon;
          return (
            <motion.button
              key={pack.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group text-left ring-1 ring-[hsl(24,95%,53%)]/20 hover:ring-[hsl(24,95%,53%)]/60 transition-all bg-[#1a1a1a]"
            >
              {/* Duża ikona pomarańczowa */}
              <div className="absolute inset-0 flex items-center justify-center pb-12">
                <Icon
                  size={88}
                  strokeWidth={1.25}
                  className="text-[hsl(24,95%,53%)] transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_20px_hsl(24,95%,53%,0.35)]"
                />
              </div>

              {/* Subtelny gradient u dołu dla czytelności tytułu */}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              {/* Premium badge */}
              {pack.isPremium && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[hsl(24,95%,53%)] text-white shadow-lg">
                  <Crown size={11} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Premium</span>
                </div>
              )}

              {/* Tytuł */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <span
                  className="block text-white text-base font-bold leading-tight drop-shadow-md"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {pack.label}
                </span>
                <div className="mt-1 h-0.5 w-8 bg-[hsl(24,95%,53%)] rounded-full" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
