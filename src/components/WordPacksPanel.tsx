import { motion } from "framer-motion";
import { Crown, BookOpen, Brain, Users, Briefcase, Church, Landmark, Palette, Sparkles, Music, Film, Scroll, FlaskConical, Trophy, Globe, Heart } from "lucide-react";
import { categories } from "@/data/words";

import imgFilozofia from "@/assets/packs/filozofia.jpg";
import imgLiteratura from "@/assets/packs/literatura.jpg";
import imgPsychologia from "@/assets/packs/psychologia.jpg";
import imgCiekawiLudzie from "@/assets/packs/ciekawi_ludzie.jpg";
import imgBiznes from "@/assets/packs/biznes_finanse.jpg";
import imgReligia from "@/assets/packs/religia.jpg";
import imgHistoria from "@/assets/packs/historia.jpg";
import imgSztuka from "@/assets/packs/sztuka.jpg";
import imgOgolne from "@/assets/packs/ogolne.jpg";
import imgWlasne from "@/assets/packs/wlasne.jpg";
import imgShowbiznes from "@/assets/packs/showbiznes.jpg";
import imgMuzyka from "@/assets/packs/muzyka.jpg";
import imgArchaizmy from "@/assets/packs/archaizmy.jpg";
import imgNauka from "@/assets/packs/nauka.jpg";
import imgSport from "@/assets/packs/sport.jpg";

interface WordPack {
  id: string;
  label: string;
  icon: typeof BookOpen;
  image: string;
  isPremium: boolean;
}

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

const categoryImages: Record<string, string> = {
  filozofia: imgFilozofia,
  literatura: imgLiteratura,
  psychologia: imgPsychologia,
  ciekawi_ludzie: imgCiekawiLudzie,
  biznes_finanse: imgBiznes,
  religia: imgReligia,
  historia: imgHistoria,
  sztuka: imgSztuka,
  ogólne: imgOgolne,
  własne: imgWlasne,
};

const premiumPacks: WordPack[] = [
  { id: "showbiznes", label: "Show-biznes", icon: Film, image: imgShowbiznes, isPremium: true },
  { id: "muzyka", label: "Muzyka", icon: Music, image: imgMuzyka, isPremium: true },
  { id: "archaizmy", label: "Archaizmy", icon: Scroll, image: imgArchaizmy, isPremium: true },
  { id: "nauka", label: "Nauka", icon: FlaskConical, image: imgNauka, isPremium: true },
  { id: "sport", label: "Sport", icon: Trophy, image: imgSport, isPremium: true },
];

export function WordPacksPanel() {
  const basePacks: WordPack[] = categories
    .filter((c) => c.value !== "all")
    .map((c) => ({
      id: c.value,
      label: c.label,
      icon: categoryIcons[c.value] || BookOpen,
      image: categoryImages[c.value] || imgOgolne,
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
          return (
            <motion.button
              key={pack.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group text-left ring-1 ring-[hsl(24,95%,53%)]/20 hover:ring-[hsl(24,95%,53%)]/60 transition-all"
            >
              {/* Tło: ilustracja line-art */}
              <img
                src={pack.image}
                alt={pack.label}
                loading="lazy"
                width={768}
                height={960}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Subtelny gradient u dołu dla czytelności tytułu */}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Premium badge */}
              {pack.isPremium && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[hsl(24,95%,53%)] text-white shadow-lg">
                  <Crown size={11} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Premium</span>
                </div>
              )}

              {/* Tytuł */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <span className="block text-white text-base font-bold leading-tight drop-shadow-md" style={{ fontFamily: "var(--font-display)" }}>
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
