import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, BookOpen, Shuffle } from "lucide-react";
import { words } from "@/data/words";
import { WordCard } from "@/components/WordCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useFavorites } from "@/hooks/use-favorites";
import { useTheme } from "@/hooks/use-theme";

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
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [currentIndex, setCurrentIndex] = useState(() => getRandomIndex(words.length));

  const favoriteWords = useMemo(
    () => words.filter((w) => favorites.includes(w.id)),
    [favorites]
  );

  const activeWords = viewMode === "favorites" ? favoriteWords : words;
  const currentWord = activeWords[currentIndex % activeWords.length];

  const handleNext = useCallback(() => {
    if (activeWords.length === 0) return;
    setCurrentIndex((prev) => getRandomIndex(activeWords.length, prev));
  }, [activeWords.length]);

  const hasFavorites = favoriteWords.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="w-full max-w-lg mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BookOpen size={20} className="text-primary" />
          <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Słownik
          </span>
        </div>
        <div className="flex items-center gap-1">
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
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        {activeWords.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4"
          >
            <Heart size={48} className="mx-auto text-muted-foreground/30" />
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Brak ulubionych
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dodaj słowa do ulubionych, aby je tu zobaczyć.
              </p>
            </div>
            <button
              onClick={() => setViewMode("all")}
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
            ? `Uczysz się z ${favoriteWords.length} ulubionych słów`
            : `${words.length} trudnych słów do nauki`}
        </p>
      </footer>
    </div>
  );
};

export default Index;
