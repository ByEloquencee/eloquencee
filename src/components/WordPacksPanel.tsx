import { motion } from "framer-motion";
import { Crown, BookOpen, Brain, Users, Briefcase, Church, Landmark, Palette, Music, Film, Scroll, FlaskConical, Trophy, Globe, Heart, ChevronRight, Sparkles, type LucideIcon } from "lucide-react";
import { categories, words, type WordCategory } from "@/data/words";

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

interface SubPack {
  id: string;
  label: string;
  count: number;
  icon: LucideIcon;
}

interface Collection {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  /** Tailwind classes for the banner background (uses semantic-ish solid colors) */
  bgClass: string;
  /** Text color on the banner */
  textClass: string;
  /** Tint behind the small subcards */
  cardClass: string;
  isPremium?: boolean;
  packs: SubPack[];
}

const categoryIcons: Record<string, LucideIcon> = {
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

function countWords(cat: WordCategory): number {
  return words.filter((w) => w.category === cat).length;
}

export function WordPacksPanel() {
  // === Kolekcja 1: Humanistyka ===
  const humanisticCats: WordCategory[] = ["filozofia", "literatura", "historia", "religia", "sztuka"];
  const humanistic: Collection = {
    id: "humanistyka",
    title: "Skarbiec humanistyki",
    subtitle: "Słowa, które otwierają drzwi do kultury i myśli.",
    image: imgFilozofia,
    bgClass: "bg-[hsl(215,42%,20%)]",
    textClass: "text-white",
    cardClass: "bg-white/10 hover:bg-white/15",
    packs: humanisticCats.map((c) => ({
      id: c,
      label: categories.find((x) => x.value === c)?.label || c,
      count: countWords(c),
      icon: categoryIcons[c] || BookOpen,
    })),
  };

  // === Kolekcja 2: Człowiek i świat ===
  const lifeCats: WordCategory[] = ["psychologia", "ciekawi_ludzie", "biznes_finanse", "ogólne"];
  const life: Collection = {
    id: "zycie",
    title: "Człowiek i świat",
    subtitle: "Pojęcia z codzienności, psychiki i relacji.",
    image: imgPsychologia,
    bgClass: "bg-[hsl(24,70%,42%)]",
    textClass: "text-white",
    cardClass: "bg-black/15 hover:bg-black/25",
    packs: lifeCats.map((c) => ({
      id: c,
      label: categories.find((x) => x.value === c)?.label || c,
      count: countWords(c),
      icon: categoryIcons[c] || BookOpen,
    })),
  };

  // === Kolekcja 3: Premium ===
  const premium: Collection = {
    id: "premium",
    title: "Kolekcja Premium",
    subtitle: "Ekskluzywne paczki tylko dla subskrybentów.",
    image: imgMuzyka,
    bgClass: "bg-[hsl(0,0%,8%)]",
    textClass: "text-white",
    cardClass: "bg-[hsl(24,95%,53%)]/10 hover:bg-[hsl(24,95%,53%)]/20 ring-1 ring-[hsl(24,95%,53%)]/30",
    isPremium: true,
    packs: [
      { id: "showbiznes", label: "Show-biznes", count: 0, icon: Film },
      { id: "muzyka", label: "Muzyka", count: 0, icon: Music },
      { id: "archaizmy", label: "Archaizmy", count: 0, icon: Scroll },
      { id: "nauka", label: "Nauka", count: 0, icon: FlaskConical },
      { id: "sport", label: "Sport", count: 0, icon: Trophy },
    ],
  };

  // === Kolekcja 4: Własne (jeśli istnieją) ===
  const ownCount = countWords("własne");
  const own: Collection | null = {
    id: "wlasne",
    title: "Twoja kolekcja",
    subtitle: ownCount > 0 ? "Słowa dodane przez Ciebie." : "Dodaj własne słowa, by tu się pojawiły.",
    image: imgWlasne,
    bgClass: "bg-[hsl(150,25%,22%)]",
    textClass: "text-white",
    cardClass: "bg-white/10 hover:bg-white/15",
    packs: [
      { id: "własne", label: "Własne słowa", count: ownCount, icon: Heart },
    ],
  };

  const collections: Collection[] = [humanistic, life, premium, own];

  return (
    <div className="w-full max-w-lg space-y-3 pb-4">
      <div className="px-1">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Paczki słów
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tematyczne kolekcje do nauki
        </p>
      </div>

      {collections.map((col, idx) => (
        <motion.section
          key={col.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={`relative overflow-hidden rounded-2xl ${col.bgClass} ${col.textClass}`}
        >
          {/* Header banera */}
          <div className="flex items-start justify-between gap-3 p-4 pb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {col.isPremium && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[hsl(24,95%,53%)] text-white text-[9px] font-bold uppercase tracking-wider">
                    <Crown size={9} />
                    Premium
                  </span>
                )}
              </div>
              <h3
                className="mt-1 text-lg font-bold leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {col.title}
              </h3>
              <p className="text-xs opacity-80 mt-0.5 leading-snug">{col.subtitle}</p>
            </div>

            {/* Mini ilustracja kolekcji */}
            <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-black/20">
              <img
                src={col.image}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          </div>

          {/* Lista podpaczek */}
          <div className="px-3 pb-3 space-y-1.5">
            {col.packs.map((p) => {
              const Icon = p.icon;
              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${col.cardClass}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-tight truncate">{p.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">
                      {col.isPremium ? "Dostępne wkrótce" : `${p.count} ${pluralWords(p.count)}`}
                    </div>
                  </div>
                  <ChevronRight size={14} className="opacity-60 shrink-0" />
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      ))}
    </div>
  );
}

function pluralWords(n: number): string {
  if (n === 1) return "słowo";
  const lastTwo = n % 100;
  const last = n % 10;
  if (lastTwo >= 12 && lastTwo <= 14) return "słów";
  if (last >= 2 && last <= 4) return "słowa";
  return "słów";
}
