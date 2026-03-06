import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
import { DailyProgress } from "@/components/DailyProgress";
import { WordAIChat } from "@/components/WordAIChat";
import { FlashcardCreator } from "@/components/FlashcardCreator";
import { FlashcardSetCreator } from "@/components/FlashcardSetCreator";
import { useFlashcardSets } from "@/hooks/use-flashcard-sets";
import { ShareWordDialog } from "@/components/ShareWordDialog";
import { PlusMenuDialog } from "@/components/PlusMenuDialog";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import { FolderDropdown } from "@/components/FolderDropdown";
import { useFavorites } from "@/hooks/use-favorites";
import { useCustomWords } from "@/hooks/use-custom-words";
import { useFolders } from "@/hooks/use-folders";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useDailyProgress } from "@/hooks/use-daily-progress";
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
  const { todayCount, increment: incrementProgress, decrement: decrementProgress } = useDailyProgress();
  const { customWords, refetch: refetchCustom, deleteWord, updateWord } = useCustomWords();
  const { folders, createFolder, deleteFolder, toggleWordInFolder } = useFolders();
  const { sets: flashcardSets, createSet, deleteSet, refetch: refetchSets } = useFlashcardSets();
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<(WordCategory | "all")[]>(["all"]);
  const [currentIndex, setCurrentIndex] = useState(() => getRandomIndex(words.length));
  const [history, setHistory] = useState<number[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [addWordOpen, setAddWordOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createSetOpen, setCreateSetOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<PolishWord | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quizModeOpen, setQuizModeOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [quizWords, setQuizWords] = useState<PolishWord[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setSliderWidth(container.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const switchPage = useCallback((nextPage: number) => {
    if (nextPage === activePage) return;
    setIsPageTransitioning(true);
    setActivePage(nextPage);
  }, [activePage]);

  useEffect(() => {
    if (user && profile && !profile.onboarding_done) {
      setShowOnboarding(true);
    }
  }, [user, profile]);

  const handleOnboardingComplete = async (cats: WordCategory[], dailyGoal: number) => {
    try {
      await updateProfile({
        preferred_categories: cats,
        onboarding_done: true,
        daily_goal: dailyGoal,
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
    // If a folder is active, show only words in that folder
    if (activeFolderId) {
      const folder = folders.find((f) => f.id === activeFolderId);
      if (!folder) return [];
      return allWords.filter((w) => folder.wordIds.includes(w.id));
    }
    const base = viewMode === "favorites" ? favoriteWords : allWords;
    if (selectedCategories.includes("all")) return base;
    return base.filter((w) => selectedCategories.includes(w.category));
  }, [viewMode, favoriteWords, selectedCategories, allWords, activeFolderId, folders]);

  const currentWord = filteredWords[currentIndex % filteredWords.length];

  const preferredCategories = profile?.preferred_categories || [];

  const handleNext = useCallback(() => {
    if (filteredWords.length === 0) return;
    setHistory((prev) => [...prev, currentIndex]);
    if (selectedCategories.includes("all") && preferredCategories.length > 0) {
      setCurrentIndex((prev) => pickWeightedWord(filteredWords, preferredCategories, prev));
    } else {
      setCurrentIndex((prev) => getRandomIndex(filteredWords.length, prev));
    }
  }, [filteredWords, selectedCategories, preferredCategories, currentIndex]);

  const handlePrev = useCallback(() => {
    if (history.length === 0) return;
    setHistory((prev) => {
      const next = [...prev];
      const lastIndex = next.pop()!;
      setCurrentIndex(lastIndex);
      return next;
    });
  }, [history]);

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
        words={quizWords}
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
              onClick={() => setPlusMenuOpen(true)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Dodaj"
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
                  setActiveFolderId(null);
                  setViewMode((v) => (v === "favorites" ? "all" : "favorites"));
                  setCurrentIndex(0);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  viewMode === "favorites" && !activeFolderId
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Heart size={14} className={viewMode === "favorites" && !activeFolderId ? "fill-primary-foreground" : ""} />
                <span>{favoriteWords.length}</span>
              </motion.button>
            )}
            <FolderDropdown
              folders={folders}
              activeFolder={activeFolderId}
              onSelectFolder={(id) => {
                setActiveFolderId(id);
                if (id) setViewMode("all");
                setCurrentIndex(0);
              }}
              onDeleteFolder={async (id) => {
                try {
                  await deleteFolder(id);
                  toast.success("Folder usunięty!");
                } catch {
                  toast.error("Nie udało się usunąć folderu");
                }
              }}
            />
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

      {/* Category filter - hidden on page 2 */}
      <AnimatePresence>
        {activePage === 0 && !isPageTransitioning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg mx-auto px-4 pb-4"
          >
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setCategoriesOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <span className="truncate max-w-[180px]">{selectedCategoryLabels}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform flex-shrink-0 ${categoriesOpen ? "rotate-180" : ""}`}
                />
              </button>
              <DailyProgress current={todayCount} goal={profile?.daily_goal ?? 5} />
            </div>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipeable content area */}
      <main className="flex-1 flex flex-col overflow-hidden relative" ref={containerRef}>

        <div className="flex-1 relative overflow-hidden flex items-center">
          <motion.div
            className="flex min-w-full"
            style={{ touchAction: "pan-y" }}
            animate={{ x: -activePage * sliderWidth }}
            transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
            onAnimationComplete={() => setIsPageTransitioning(false)}
            drag={sliderWidth > 0 ? "x" : false}
            dragMomentum={false}
            dragConstraints={{ left: -sliderWidth, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              const threshold = 30;
              if (info.offset.x < -threshold && activePage === 0) {
                switchPage(1);
              } else if (info.offset.x > threshold && activePage === 1) {
                switchPage(0);
              }
            }}
          >
            {/* Page 1: Word card */}
            <div className="w-full flex-shrink-0 flex items-center justify-center px-4">
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
                    onClick={() => { setViewMode("all"); setSelectedCategories(["all"]); setActiveFolderId(null); }}
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
                    onToggleFavorite={() => {
                      const wasFav = isFavorite(currentWord.id);
                      toggleFavorite(currentWord.id);
                      if (!wasFav) incrementProgress();
                      else decrementProgress();
                    }}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    canGoBack={history.length > 0}
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
                    onAskAI={() => setAiChatOpen(true)}
                    folders={folders}
                    onToggleFolder={(folderId) => toggleWordInFolder(folderId, currentWord.id)}
                    onShare={() => setShareOpen(true)}
                  />
                )
              )}
            </div>

            {/* Page 2: Flashcard creator */}
            <div className="w-full flex-shrink-0 flex items-center justify-center px-4">
              <FlashcardCreator
                onAddWord={() => setAddWordOpen(true)}
                onCreateSet={() => setCreateSetOpen(true)}
                sets={flashcardSets}
                onDeleteSet={async (id) => {
                  try {
                    await deleteSet(id);
                    refetchCustom();
                    toast.success("Zestaw usunięty!");
                  } catch {
                    toast.error("Nie udało się usunąć zestawu");
                  }
                }}
              />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Page indicator dots + footer */}
      <div className="pb-6 flex flex-col items-center gap-2">
        <div className="flex justify-center gap-2">
          {[0, 1].map((i) => (
            <button
              key={i}
              onClick={() => switchPage(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activePage === i
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {activePage === 1
            ? "Przesuń w prawo, aby wrócić do słów"
            : activeFolderId
              ? `${filteredWords.length} słów w folderze`
              : viewMode === "favorites"
                ? `Uczysz się z ${filteredWords.length} ulubionych słów`
                : `${filteredWords.length} słów do nauki`}
        </p>
      </div>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
      <PlusMenuDialog
        open={plusMenuOpen}
        onClose={() => setPlusMenuOpen(false)}
        onAddWord={() => setAddWordOpen(true)}
        onCreateFolder={() => setCreateFolderOpen(true)}
      />
      <AddWordDialog open={addWordOpen} onClose={() => setAddWordOpen(false)} onAdded={refetchCustom} />
      <CreateFolderDialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onCreated={async (name, icon) => {
          await createFolder(name, icon);
          toast.success("Folder utworzony!");
        }}
      />
      <EditWordDialog open={!!editingWord} word={editingWord} onClose={() => setEditingWord(null)} onSave={updateWord} />
      <OnboardingDialog
        open={showOnboarding}
        name={profile?.name || ""}
        onComplete={handleOnboardingComplete}
      />
      <QuizModeDialog
        open={quizModeOpen}
        onClose={() => setQuizModeOpen(false)}
        onStartQuiz={(source) => {
          setQuizModeOpen(false);
          if (source === "favorites") {
            setQuizWords(favoriteWords);
          } else {
            const folder = folders.find((f) => f.id === source);
            if (folder) {
              setQuizWords(allWords.filter((w) => folder.wordIds.includes(w.id)));
            }
          }
          setQuizActive(true);
        }}
        hasFavorites={hasEnoughForQuiz}
        folders={folders}
      />
      {currentWord && (
        <>
          <WordAIChat
            word={currentWord}
            open={aiChatOpen}
            onClose={() => setAiChatOpen(false)}
          />
          <ShareWordDialog
            word={currentWord}
            open={shareOpen}
            onClose={() => setShareOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default Index;
