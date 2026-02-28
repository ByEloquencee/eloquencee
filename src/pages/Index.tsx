import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shuffle, Plus, User } from "lucide-react";
import { words, categories, type WordCategory } from "@/data/words";
import { WordCard } from "@/components/WordCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthDialog } from "@/components/AuthDialog";
import { AddWordDialog } from "@/components/AddWordDialog";
import { useFavorites } from "@/hooks/use-favorites";
import { useCustomWords } from "@/hooks/use-custom-words";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";

type ViewMode = "all" | "favorites";

function getRandomIndex(max: number, exclude?: number): number {
  if (max <= 1) return 0;
  let idx: number;
  do {
    idx = Math.floor(Math.random() * max);
  } while (idx === exclude);
  return idx;
}

const Index = () => {
  const { isDark, toggle: toggleTheme } = useTheme();
  const { user } = useAuth();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { customWords, refetch: refetchCustom } = useCustomWords();
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | "all">("all");
  const [currentIndex, setCurrentIndex] = useState(() => getRandomIndex(words.length));
  const [authOpen, setAuthOpen] = useState(false);
  const [addWordOpen, setAddWordOpen] = useState(false);

  const allWords = useMemo(() => [...words, ...customWords], [customWords]);

  const favoriteWords = useMemo(
    () => allWords.filter((w) => favorites.includes(w.id)),
    [favorites, allWords]
  );

  // Only show "własne" category if user has custom words
  const visibleCategories = useMemo(() => {
    if (customWords.length > 0) return categories;
    return categories.filter(c => c.value !== "własne");
  }, [customWords.length]);

  const filteredWords = useMemo(() => {
    const base = viewMode === "favorites" ? favoriteWords : allWords;
    if (selectedCategory === "all") return base;
    return base.filter((w) => w.category === selectedCategory);
  }, [viewMode, favoriteWords, selectedCategory, allWords]);

  const currentWord = filteredWords[currentIndex % filteredWords.length];

  const handleNext = useCallback(() => {
    if (filteredWords.length === 0) return;
    setCurrentIndex((prev) => getRandomIndex(filteredWords.length, prev));
  }, [filteredWords.length]);

  const hasFavorites = favoriteWords.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="w-full max-w-lg mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Eloquencee
          </span>
          <span className="text-[10px] text-muted-foreground tracking-wide">
            Ucz się nowych słów każdego dnia!
          </span>
        </div>
        <div className="flex items-center gap-1">
          {user && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setAddWordOpen(true)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Dodaj własne słowo"
            >
              <Plus size={18} />
            </motion.button>
          )}
          {hasFavorites && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setViewMode((v) => (v === "favorites" ? "all" : "favorites"));
                setCurrentIndex(0);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                viewMode === "favorites"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Heart size={14} className={viewMode === "favorites" ? "fill-primary-foreground" : ""} />
              <span>{favoriteWords.length}</span>
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setAuthOpen(true)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              user
                ? "text-primary hover:bg-secondary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            title={user ? user.email || "Konto" : "Zaloguj się"}
          >
            <User size={18} />
          </motion.button>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </header>

      {/* Category filter */}
      <div className="w-full max-w-lg mx-auto px-4 pb-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {visibleCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setSelectedCategory(cat.value);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        {filteredWords.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4"
          >
            <Heart size={48} className="mx-auto text-muted-foreground/30" />
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Brak słów
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Nie znaleziono słów w tej kategorii.
              </p>
            </div>
            <button
              onClick={() => { setViewMode("all"); setSelectedCategory("all"); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Shuffle size={16} />
              Wszystkie słowa
            </button>
          </motion.div>
        ) : (
          currentWord && (
            <WordCard
              word={currentWord}
              isFavorite={isFavorite(currentWord.id)}
              onToggleFavorite={() => toggleFavorite(currentWord.id)}
              onNext={handleNext}
            />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="pb-6 text-center">
        <p className="text-xs text-muted-foreground">
          {viewMode === "favorites"
            ? `Uczysz się z ${filteredWords.length} ulubionych słów`
            : `${filteredWords.length} słów do nauki`}
        </p>
      </footer>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
      <AddWordDialog open={addWordOpen} onClose={() => setAddWordOpen(false)} onAdded={refetchCustom} />
    </div>
  );
};

export default Index;
