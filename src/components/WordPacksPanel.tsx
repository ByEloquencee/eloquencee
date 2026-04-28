import { motion } from "framer-motion";
import { Crown, BookOpen, Brain, Users, Briefcase, Church, Landmark, Palette, Sparkles, Music, Film, Scroll, FlaskConical, Trophy, Globe, Heart } from "lucide-react";
import { categories } from "@/data/words";

interface WordPack {
  id: string;
  label: string;
  icon: typeof BookOpen;
  isPremium: boolean;
}

// Mapowanie ikon dla podstawowych kategorii
const categoryIcons: Record<string, typeof BookOpen> = {
  filozofia: Brain,
  literatura: BookOpen,
  psychologia: Sparkles,
  ciekawi_ludzie: Users,
  biznes_finanse: Briefcase,
  religia: Church,
  historia: Landmark,
  sztuka: Palette,
  ogólne: Globe,
  własne: Heart,
};

// Paczki premium (na razie nie funkcjonalne)
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

      <div className="grid grid-cols-2 gap-2.5">
        {allPacks.map((pack, i) => {
          const Icon = pack.icon;
          return (
            <motion.button
              key={pack.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative aspect-[4/3] rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer p-3 flex flex-col justify-between text-left overflow-hidden"
            >
              {pack.isPremium && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
                  <Crown size={10} />
                  <span className="text-[9px] font-semibold uppercase tracking-wide">Premium</span>
                </div>
              )}
              <Icon size={22} className={pack.isPremium ? "text-primary" : "text-foreground"} />
              <span className="text-sm font-medium leading-tight">{pack.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
