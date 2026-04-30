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
  Stethoscope,
} from "lucide-react";
import { categories } from "@/data/words";

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

const categoryWatermarks: Record<string, string[]> = {
  filozofia: ["byt", "logos", "etyka", "sens", "dusza", "rozum"],
  literatura: ["wiersz", "proza", "metafora", "epika", "sonet", "narracja"],
  psychologia: ["empatia", "afekt", "trauma", "ego", "nawyk", "lęk"],
  ciekawi_ludzie: ["geniusz", "wizjoner", "ikona", "mentor", "buntownik"],
  biznes_finanse: ["kapitał", "inwestycja", "ryzyko", "zysk", "rynek", "audyt"],
  religia: ["sacrum", "rytuał", "modlitwa", "wiara", "łaska", "kult"],
  historia: ["epoka", "rewolucja", "dynastia", "traktat", "imperium"],
  sztuka: ["barok", "kolaż", "fresk", "akwarela", "rzeźba", "perspektywa"],
  ogólne: ["słowo", "język", "kultura", "myśl", "idea", "świat"],
  własne: ["notatka", "własne", "moje", "kolekcja"],
  showbiznes: ["gala", "celebryta", "premiera", "skandal", "wywiad"],
  muzyka: ["harmonia", "rytm", "melodia", "akord", "tonacja", "fraza"],
  archaizmy: ["azaliż", "snadź", "wszelako", "tedy", "albowiem"],
  nauka: ["hipoteza", "atom", "teoria", "synteza", "kwant", "dowód"],
  sport: ["finał", "rekord", "trener", "drużyna", "puchar", "taktyka"],
};

const premiumPacksMeta: Omit<WordPack, "count">[] = [
  { id: "showbiznes", label: "Show-biznes", icon: Film, isPremium: true, watermarks: categoryWatermarks.showbiznes },
  { id: "muzyka", label: "Muzyka", icon: Music, isPremium: true, watermarks: categoryWatermarks.muzyka },
  { id: "archaizmy", label: "Archaizmy", icon: Scroll, isPremium: true, watermarks: categoryWatermarks.archaizmy },
  { id: "nauka", label: "Nauka", icon: FlaskConical, isPremium: true, watermarks: categoryWatermarks.nauka },
  { id: "sport", label: "Sport", icon: Trophy, isPremium: true, watermarks: categoryWatermarks.sport },
];

// Deterministyczny "random" na podstawie id, żeby liczba nie zmieniała się przy re-renderach
function pseudoCount(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 18 + (h % 83); // 18–100
}

// Pozycje znaków wodnych — stałe, żeby się nie skakały
const watermarkPositions = [
  { top: "8%", left: "6%", rotate: -12, size: 11 },
  { top: "14%", left: "62%", rotate: 8, size: 10 },
  { top: "32%", left: "4%", rotate: -6, size: 9 },
  { top: "38%", left: "70%", rotate: 14, size: 12 },
  { top: "56%", left: "10%", rotate: -10, size: 10 },
  { top: "60%", left: "58%", rotate: 6, size: 11 },
];

export function WordPacksPanel() {
  const basePacks: WordPack[] = categories
    .filter((c) => c.value !== "all")
    .map((c) => ({
      id: c.value,
      label: c.label,
      icon: categoryIcons[c.value] || BookOpen,
      isPremium: false,
      watermarks: categoryWatermarks[c.value] || ["słowo", "język", "myśl"],
      count: pseudoCount(c.value),
    }));

  const premiumPacks: WordPack[] = premiumPacksMeta.map((p) => ({
    ...p,
    count: pseudoCount(p.id),
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
              className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group text-left ring-1 ring-primary/20 hover:ring-primary/60 transition-all bg-[#1a1a1a]"
              style={{ containerType: "inline-size" }}
            >
              {/* Znaki wodne — wiele słów w linijce, wypełniają całą szerokość karty */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none select-none flex flex-col justify-between py-1.5 px-1.5 gap-1">
                {Array.from({ length: 13 }).map((_, rowIdx) => {
                  const repeated = Array.from({ length: 6 }, (_, i) => pack.watermarks[(rowIdx + i) % pack.watermarks.length]).join(" · ");
                  return (
                    <span
                      key={rowIdx}
                      className="block text-primary/15 font-bold whitespace-nowrap leading-none w-full text-[11px]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {repeated}
                    </span>
                  );
                })}
              </div>

              {/* Duża ikona pomarańczowa */}
              <div className="absolute inset-0 flex items-center justify-center pb-12">
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

              {/* Tytuł + licznik */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <span
                  className="block text-white text-base font-bold leading-tight drop-shadow-md"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {pack.label}
                </span>
                <div className="mt-1 flex items-center gap-2">
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
