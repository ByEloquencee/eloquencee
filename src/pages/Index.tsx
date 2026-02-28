import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shuffle, Plus, User, ChevronDown, GraduationCap } from "lucide-react";
import { words, categories, type WordCategory, type PolishWord } from "@/data/words";
import { WordCard } from "@/components/WordCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthDialog } from "@/components/AuthDialog";
import { AddWordDialog } from "@/components/AddWordDialog";
import { EditWordDialog } from "@/components/EditWordDialog";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { QuizModeDialog } from "@/components/QuizModeDialog";
import { QuizView } from "@/components/QuizView";
import { useFavorites } from "@/hooks/use-favorites";
import { useCustomWords } from "@/hooks/use-custom-words";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

type ViewMode = "all" | "favorites";

function getRandomIndex(max: number, exclude?: number): number {
  if (max <= 1) return 0;
  let idx: number;
  do {
    idx = Math.floor(Math.random() * max);
  } while (idx === exclude);
  return idx;
}

function pickWeightedWord(
  allWords: PolishWord[],
  preferredCategories: WordCategory[],
  exclude?: number
): number {
  if (allWords.length <= 1) return 0;
  if (preferredCategories.length === 0) return getRandomIndex(allWords.length, exclude);

  // 80% chance to pick from preferred categories
  const usePreferred = Math.random() < 0.8;
  if (usePreferred) {
    const preferredIndices = allWords
      .map((w, i) => (preferredCategories.includes(w.category) ? i : -1))
      .filter((i) => i !== -1 && i !== exclude);
    if (preferredIndices.length > 0) {
      return preferredIndices[Math.floor(Math.random() * preferredIndices.length)];
    }
  }
  return getRandomIndex(allWords.length, exclude);
}

const Index = () => {
  const { isDark, toggle: toggleTheme } = useTheme();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { customWords, refetch: refetchCustom, deleteWord, updateWord } = useCustomWords();
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedCategories, setSelectedCategories] = useState<(WordCategory | "all")[]>(["all"]);
  const [currentIndex, setCurrentIndex] = useState(() => getRandomIndex(words.length));
  const [authOpen, setAuthOpen] = useState(false);
  const [addWordOpen, setAddWordOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<PolishWord | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quizModeOpen, setQuizModeOpen] = useState(false);
  const [quizActive, setQuizActive] = useState(false);

  // Show onboarding after first login
  useEffect(() => {
    if (user && profile && !profile.onboarding_done) {
      setShowOnboarding(true);
    }
  }, [user, profile]);

  const handleOnboardingComplete = async (cats: WordCategory[]) => {
    try {
      await updateProfile({
        preferred_categories: cats,
        onboarding_done: true,
      });
      if (cats.length > 0) {
        setSelectedCategories(cats);
      }
    } catch {
      // silently continue
    }
    setShowOnboarding(false);
  };

  const allWords = useMemo(() => [...words, ...customWords], [customWords]);

  const favoriteWords = useMemo(
    () => allWords.filter((w) => favorites.includes(w.id)),
    [favorites, allWords]
  );

  const visibleCategories = useMemo(() => {
    if (customWords.length > 0) return categories;
    return categories.filter(c => c.value !== "własne");
  }, [customWords.length]);

  const filteredWords = useMemo(() => {
    const base = viewMode === "favorites" ? favoriteWords : allWords;
    if (selectedCategories.includes("all")) return base;
    return base.filter((w) => selectedCategories.includes(w.category));
  }, [viewMode, favoriteWords, selectedCategories, allWords]);

  const currentWord = filteredWords[currentIndex % filteredWords.length];

  const preferredCategories = profile?.preferred_categories || [];

  const handleNext = useCallback(() => {
    if (filteredWords.length === 0) return;
    // If showing all words and user has preferences, use weighted selection
    if (selectedCategories.includes("all") && preferredCategories.length > 0) {
      setCurrentIndex((prev) => pickWeightedWord(filteredWords, preferredCategories, prev));
    } else {
      setCurrentIndex((prev) => getRandomIndex(filteredWords.length, prev));
    }
  }, [filteredWords, selectedCategories, preferredCategories]);

  const toggleCategory = (cat: WordCategory | "all") => {
    if (cat === "all") {
      setSelectedCategories(["all"]);
    } else {
      setSelectedCategories((prev) => {
        const withoutAll = prev.filter((c) => c !== "all");
        const next = withoutAll.includes(cat)
          ? withoutAll.filter((c) => c !== cat)
          : [...withoutAll, cat];
        return next.length === 0 ? ["all"] : next;
      });
    }
    setCurrentIndex(0);
  };

  const hasFavorites = favoriteWords.length > 0;
  const hasEnoughForQuiz = favoriteWords.length >= 4;

  const selectedCategoryLabels = useMemo(() => {
    if (selectedCategories.includes("all")) return "Wszystkie";
    return selectedCategories
      .map((c) => categories.find((cat) => cat.value === c)?.label || c)
      .join(", ");
  }, [selectedCategories]);

  if (quizActive) {
    return (
      <QuizView
        words={favoriteWords}
        allWords={allWords}
        onExit={() => setQuizActive(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Eloquencee
          </span>
          <span className="text-xs text-muted-foreground tracking-wide">
            {profile?.name
              ? `Cześć, ${profile.name}! Ucz się nowych słów!`
              : "Ucz się nowych słów każdego dnia!"}
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
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setQuizModeOpen(true)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="Sprawdź się"
          >
            <GraduationCap size={18} />
          </motion.button>
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
            title={user ? profile?.name || user.email || "Konto" : "Zaloguj się"}
          >
            <User size={18} />
          </motion.button>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </header>

      {/* Category filter */}
      <div className="w-full max-w-lg mx-auto px-4 pb-4">
        <button
          onClick={() => setCategoriesOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium cursor-pointer hover:bg-secondary/80 transition-colors max-w-full"
        >
          <span className="truncate">{selectedCategoryLabels}</span>
          <ChevronDown
            size={16}
            className={`transition-transform flex-shrink-0 ${categoriesOpen ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence>
          {categoriesOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 pt-3">
                {visibleCategories.map((cat) => {
                  const isSelected = cat.value === "all"
                    ? selectedCategories.includes("all")
                    : selectedCategories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12 pt-8">
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
                Nie znaleziono słów w wybranych kategoriach.
              </p>
            </div>
            <button
              onClick={() => { setViewMode("all"); setSelectedCategories(["all"]); }}
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
              isCustom={currentWord.id.startsWith("custom-")}
              onEdit={() => setEditingWord(currentWord)}
              onDelete={async () => {
                try {
                  await deleteWord(currentWord.id);
                  toast.success("Słowo usunięte!");
                  handleNext();
                } catch {
                  toast.error("Nie udało się usunąć słowa");
                }
              }}
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

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} profileName={profile?.name} />
      <AddWordDialog open={addWordOpen} onClose={() => setAddWordOpen(false)} onAdded={refetchCustom} />
      <EditWordDialog open={!!editingWord} word={editingWord} onClose={() => setEditingWord(null)} onSave={updateWord} />
      <OnboardingDialog
        open={showOnboarding}
        name={profile?.name || ""}
        onComplete={handleOnboardingComplete}
      />
      <QuizModeDialog
        open={quizModeOpen}
        onClose={() => setQuizModeOpen(false)}
        onStartQuiz={() => { setQuizModeOpen(false); setQuizActive(true); }}
        hasFavorites={hasEnoughForQuiz}
      />
    </div>
  );
};

export default Index;
