import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { Heart, Shuffle, Plus, User, ChevronDown, GraduationCap, Dumbbell, BarChart3, Shield } from "lucide-react";
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
import { FlashcardImportDialog } from "@/components/FlashcardImportDialog";
import { FlashcardStudyView } from "@/components/FlashcardStudyView";
import { FlashcardTypingView } from "@/components/FlashcardTypingView";
import { useFlashcardSets, type FlashcardSet } from "@/hooks/use-flashcard-sets";
import { ShareWordDialog } from "@/components/ShareWordDialog";
import { ExercisesView } from "@/components/ExercisesView";
import { AdminPanel } from "@/components/AdminPanel";
import { SuggestWordDialog } from "@/components/SuggestWordDialog";
import { StatsPanel } from "@/components/StatsPanel";
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
import { useModerator } from "@/hooks/use-moderator";
import { useGlobalWords } from "@/hooks/use-global-words";
import { useStaticWordManagement } from "@/hooks/use-static-word-management";
import { useLearningHistory } from "@/hooks/use-learning-history";
import { useSubscription } from "@/hooks/use-subscription";
import { PremiumDialog } from "@/components/PremiumDialog";
import { WordLimitOverlay } from "@/components/WordLimitOverlay";
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
  const [page0Tab, setPage0Tab] = useState<"stats" | "admin">("stats");
  const { isDark, toggle: toggleTheme } = useTheme();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { todayCount, increment: incrementProgress, decrement: decrementProgress } = useDailyProgress();
  const { weekData, streak, recordToday } = useLearningHistory();
  const { customWords, refetch: refetchCustom, deleteWord, updateWord } = useCustomWords();
  const { folders, createFolder, deleteFolder, toggleWordInFolder } = useFolders();
  const { sets: flashcardSets, createSet, deleteSet, refetch: refetchSets } = useFlashcardSets();
  const { isModerator } = useModerator();
  const { asPolishWords: globalPolishWords } = useGlobalWords();
  const { hiddenIds, overrides } = useStaticWordManagement();
  const { isPremium, loading: subLoading } = useSubscription();
  const [premiumOpen, setPremiumOpen] = useState(false);

  const FREE_DAILY_LIMIT = 10;
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<(WordCategory | "all")[]>(["all"]);
  const [currentIndex, setCurrentIndex] = useState(() => getRandomIndex(words.length));
  const [history, setHistory] = useState<number[]>([]);
  const [totalViewed, setTotalViewed] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("eloquencee-total-viewed") || "0");
      return typeof stored === "number" ? stored : 0;
    } catch { return 0; }
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [addWordOpen, setAddWordOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createSetOpen, setCreateSetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [studySet, setStudySet] = useState<FlashcardSet | null>(null);
  const [typingSet, setTypingSet] = useState<FlashcardSet | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<PolishWord | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quizModeOpen, setQuizModeOpen] = useState(false);
  const [suggestWordOpen, setSuggestWordOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [quizWords, setQuizWords] = useState<PolishWord[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [shareOpen, setShareOpen] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [exercisesActive, setExercisesActive] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 400);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderControls = useAnimationControls();

  const snapToActivePage = useCallback((immediate = false) => {
    const target = -activePage * sliderWidth;
    if (immediate) {
      sliderControls.set({ x: target });
    } else {
      void sliderControls.start({
        x: target,
        transition: { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.35 },
      });
    }
  }, [activePage, sliderWidth, sliderControls]);

  // Measure container width — re-run when ANY fullscreen view toggles
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => setSliderWidth(container.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, [studySet, typingSet, quizActive, exercisesActive]);

  // After returning from fullscreen, immediately set position then snap
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has settled after remount
    const raf = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (container) {
        const w = container.clientWidth;
        setSliderWidth(w);
        sliderControls.set({ x: -activePage * w });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [quizActive, exercisesActive, studySet, typingSet]);

  // Snap slider whenever page or width changes
  useEffect(() => {
    snapToActivePage();
  }, [snapToActivePage]);

  const totalPages = isModerator ? 3 : 3;

  const switchPage = useCallback((nextPage: number) => {
    if (nextPage === activePage) return;
    setIsPageTransitioning(true);
    setActivePage(nextPage);
  }, [activePage]);

  // Set default page for moderators (word card = page 1)
  // No need to redirect — all users start on page 1 (word cards)

  // Sync todayCount to learning_history
  useEffect(() => {
    if (todayCount > 0) {
      recordToday(todayCount);
    }
  }, [todayCount, recordToday]);

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

  const allWords = useMemo(() => {
    // Apply hidden words filter and overrides to built-in words
    const filteredBuiltIn = words
      .filter(w => !hiddenIds.has(w.id))
      .map(w => {
        const override = overrides.get(w.id);
        if (!override) return w;
        return {
          ...w,
          word: override.word || w.word,
          partOfSpeech: override.part_of_speech || w.partOfSpeech,
          definition: override.definition || w.definition,
          example: override.example || w.example,
          etymology: override.etymology || w.etymology,
          category: (override.category as WordCategory) || w.category,
        };
      });
    return [...filteredBuiltIn, ...globalPolishWords, ...customWords];
  }, [customWords, globalPolishWords, hiddenIds, overrides]);

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

  const dailyLimitReached = !isPremium && todayCount >= FREE_DAILY_LIMIT;

  const handleNext = useCallback(() => {
    if (filteredWords.length === 0) return;
    if (!isPremium && todayCount >= FREE_DAILY_LIMIT) {
      setPremiumOpen(true);
      return;
    }
    setHistory((prev) => [...prev, currentIndex]);
    setTotalViewed((prev: number) => {
      const next = prev + 1;
      localStorage.setItem("eloquencee-total-viewed", JSON.stringify(next));
      return next;
    });
    if (selectedCategories.includes("all") && preferredCategories.length > 0) {
      setCurrentIndex((prev) => pickWeightedWord(filteredWords, preferredCategories, prev));
    } else {
      setCurrentIndex((prev) => getRandomIndex(filteredWords.length, prev));
    }
  }, [filteredWords, selectedCategories, preferredCategories, currentIndex, isPremium, todayCount]);

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

  if (studySet) {
    return <FlashcardStudyView set={studySet} onExit={() => { setStudySet(null); setActivePage(1); }} />;
  }

  if (typingSet) {
    return <FlashcardTypingView set={typingSet} onExit={() => { setTypingSet(null); setActivePage(1); }} />;
  }

  if (quizActive) {
    return (
      <QuizView
        words={quizWords}
        allWords={allWords}
        onExit={() => { setQuizActive(false); setActivePage(1); }}
      />
    );
  }

  if (exercisesActive) {
    return (
      <ExercisesView
        difficulty={profile?.difficulty_level || "advanced"}
        onExit={() => { setExercisesActive(false); setActivePage(1); }}
      />
    );
  }

  return (
    <div className="min-h-screen h-dvh bg-background flex flex-col overflow-hidden">
      {/* Nav */}
      <header className="w-full max-w-lg mx-auto px-4 pt-[max(env(safe-area-inset-top,0.5rem),0.5rem)] pb-4 flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0 flex-shrink-0">
          <span className="text-xl sm:text-2xl font-semibold tracking-tight whitespace-nowrap" style={{ fontFamily: "var(--font-display)" }}>
            Eloquencee
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground tracking-wide truncate">
            {profile?.name
              ? `Cześć, ${profile.name}!`
              : "Ucz się nowych słów!"}
          </span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setQuizModeOpen(true)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="Sprawdź się"
          >
            <GraduationCap size={18} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setExercisesActive(true)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="Ćwiczenia"
          >
            <Dumbbell size={18} />
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
        {activePage === 1 && !isPageTransitioning && (
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
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative" ref={containerRef}>

        <div className="flex-1 relative overflow-hidden min-h-0">
          <motion.div
            className="flex min-w-full h-full"
            style={{ touchAction: "pan-y" }}
            animate={sliderControls}
            onAnimationComplete={() => setIsPageTransitioning(false)}
            drag={sliderWidth > 0 ? "x" : false}
            dragMomentum={false}
            dragConstraints={{ left: -(totalPages - 1) * sliderWidth, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              const threshold = 30;
              if (info.offset.x < -threshold && activePage < totalPages - 1) {
                switchPage(activePage + 1);
                return;
              }
              if (info.offset.x > threshold && activePage > 0) {
                switchPage(activePage - 1);
                return;
              }
              snapToActivePage();
            }}
          >
            {/* Page 0: Stats panel with optional Admin tab for moderators */}
            <div className="w-full h-full min-h-0 flex-shrink-0 flex flex-col items-center px-4 pt-2 overflow-hidden">
              {isModerator && (
                <div className="w-full max-w-lg flex gap-2 mb-3">
                  <button
                    onClick={() => setPage0Tab("stats")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      page0Tab === "stats"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <BarChart3 size={16} />
                    Twój progres
                  </button>
                  <button
                    onClick={() => setPage0Tab("admin")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      page0Tab === "admin"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Shield size={16} />
                    Panel moderatora
                  </button>
                </div>
              )}
              <div className="flex-1 w-full min-h-0 flex items-start justify-center overflow-hidden">
                {isModerator && page0Tab === "admin" ? (
                  <AdminPanel />
                ) : (
                  <StatsPanel
                    todayCount={todayCount}
                    dailyGoal={profile?.daily_goal ?? 5}
                    totalFavorites={favoriteWords.length}
                    totalViewed={totalViewed}
                    weekData={weekData}
                    streak={streak}
                  />
                )}
              </div>
            </div>
            {/* Word card page */}
            <div className="w-full h-full min-h-0 flex-shrink-0 flex items-center justify-center px-4 overflow-hidden relative">
              <WordLimitOverlay show={dailyLimitReached} onUpgrade={() => setPremiumOpen(true)} />
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
                    difficultyLevel={profile?.difficulty_level || "advanced"}
                  />
                )
              )}
            </div>

            {/* Page: Flashcard creator */}
            <div className="w-full h-full min-h-0 flex-shrink-0 flex items-center justify-center px-4 overflow-hidden">
              <FlashcardCreator
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
                onStudySet={(set) => setStudySet(set)}
                onTypingSet={(set) => setTypingSet(set)}
              />
            </div>

          </motion.div>
        </div>
      </main>

      {/* Page indicator dots + footer */}
      <div className="pb-6 flex flex-col items-center gap-2">
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
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
          {activePage === 0
            ? (isModerator && page0Tab === "admin" ? "Panel moderatora" : "Twój progres")
            : activePage === 2
              ? "Fiszki i zestawy"
              : activeFolderId
                  ? `${filteredWords.length} słów w folderze`
                  : viewMode === "favorites"
                    ? `Uczysz się z ${filteredWords.length} ulubionych słów`
                    : `${filteredWords.length} słów do nauki`}
        </p>
      </div>

      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAddWord={() => setAddWordOpen(true)}
        onCreateFolder={() => setCreateFolderOpen(true)}
        onSuggestWord={() => setSuggestWordOpen(true)}
        onOpenPremium={() => { setAuthOpen(false); setPremiumOpen(true); }}
        isPremium={isPremium}
      />
      <PremiumDialog open={premiumOpen} onClose={() => setPremiumOpen(false)} />
      <AddWordDialog open={addWordOpen} onClose={() => setAddWordOpen(false)} onAdded={refetchCustom} />
      <FlashcardSetCreator
        open={createSetOpen}
        onClose={() => setCreateSetOpen(false)}
        onCreated={async (title, description, cards, icon) => {
          await createSet(title, description, cards, icon);
          refetchCustom();
        }}
        onImport={() => setImportOpen(true)}
      />
      <FlashcardImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={async (title, description, cards) => {
          await createSet(title, description, cards);
          refetchCustom();
        }}
      />
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
        onStartRandomQuiz={(difficulty) => {
          setQuizModeOpen(false);
          const filtered = allWords.filter((w) => w.difficulty === difficulty);
          const pool = filtered.length >= 8 ? filtered : allWords;
          const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 8);
          setQuizWords(shuffled);
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
      <SuggestWordDialog open={suggestWordOpen} onClose={() => setSuggestWordOpen(false)} />
    </div>
  );
};

export default Index;
