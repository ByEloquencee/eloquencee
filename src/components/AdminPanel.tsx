import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Search, BookOpen, X, Pencil, EyeOff, Eye, Sparkles, Inbox, Check, Upload } from "lucide-react";
import { words, categories, type WordCategory, type PolishWord } from "@/data/words";
import { useGlobalWords } from "@/hooks/use-global-words";
import { useStaticWordManagement } from "@/hooks/use-static-word-management";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImportWordsDialog } from "@/components/ImportWordsDialog";

const editableCategories = categories.filter(c => c.value !== "all" && c.value !== "własne");
const difficultyOptions = [
  { value: "beginner", label: "Początkujący" },
  { value: "intermediate", label: "Średni" },
  { value: "advanced", label: "Zaawansowany" },
];

const inputClass = "w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function AdminPanel() {
  const { user } = useAuth();
  const { globalWords, addWord, deleteWord, loading } = useGlobalWords();
  const { hiddenIds, overrides, hideWord, unhideWord, saveOverride, deleteOverride } = useStaticWordManagement();
  const [tab, setTab] = useState<"static" | "global" | "suggestions">("global");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingStatic, setEditingStatic] = useState<PolishWord | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiHint, setAiHint] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  // Suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    const { data } = await (supabase.from("word_suggestions" as any).select("*").eq("status", "pending").order("created_at", { ascending: false }) as any);
    setSuggestions(data || []);
    setSuggestionsLoading(false);
    setSuggestionsLoaded(true);
  };

  const handleTabChange = (newTab: "static" | "global" | "suggestions") => {
    setTab(newTab);
    if (newTab === "suggestions" && !suggestionsLoaded) {
      loadSuggestions();
    }
  };

  const approveSuggestion = async (s: any) => {
    try {
      await addWord({
        word: s.word,
        part_of_speech: s.part_of_speech || "",
        definition: s.definition || "",
        example: s.example || "",
        etymology: s.etymology || null,
        category: s.category || "ogólne",
        difficulty: "advanced",
        created_by: user?.id || null,
      } as any);
      await (supabase.from("word_suggestions" as any).update({ status: "approved" }).eq("id", s.id) as any);
      setSuggestions(prev => prev.filter(x => x.id !== s.id));
      toast.success(`"${s.word}" dodane do bazy!`);
    } catch {
      toast.error("Nie udało się zatwierdzić");
    }
  };

  const rejectSuggestion = async (s: any) => {
    try {
      await (supabase.from("word_suggestions" as any).update({ status: "rejected" }).eq("id", s.id) as any);
      setSuggestions(prev => prev.filter(x => x.id !== s.id));
      toast.success("Propozycja odrzucona");
    } catch {
      toast.error("Nie udało się odrzucić");
    }
  };

  // Add form state
  const [form, setForm] = useState({
    word: "", part_of_speech: "", definition: "", example: "", etymology: "", category: "ogólne", difficulty: "advanced",
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit static form state
  const [editForm, setEditForm] = useState({
    word: "", partOfSpeech: "", definition: "", example: "", etymology: "", category: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-word", {
        body: { category: form.category, difficulty: form.difficulty, hint: aiHint },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setForm(f => ({
        ...f,
        word: data.word || "",
        part_of_speech: data.part_of_speech || "",
        definition: data.definition || "",
        example: data.example || "",
        etymology: data.etymology || "",
      }));
      setAiHint("");
      toast.success("Słowo wygenerowane przez AI!");
    } catch (err: any) {
      toast.error(err.message || "Nie udało się wygenerować słowa");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.word.trim() || !form.definition.trim()) return;
    setSubmitting(true);
    try {
      await addWord({
        word: form.word.trim(),
        part_of_speech: form.part_of_speech.trim(),
        definition: form.definition.trim(),
        example: form.example.trim(),
        etymology: form.etymology.trim() || null,
        category: form.category,
        difficulty: form.difficulty,
        created_by: user?.id || null,
      } as any);
      toast.success("Słowo dodane do bazy globalnej!");
      setForm({ word: "", part_of_speech: "", definition: "", example: "", etymology: "", category: "ogólne", difficulty: "advanced" });
      setAddOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Nie udało się dodać słowa");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    try {
      await deleteWord(id);
      toast.success("Słowo usunięte z bazy!");
      setConfirmDeleteId(null);
    } catch {
      toast.error("Nie udało się usunąć słowa");
    }
  };

  const handleHideStatic = async (wordId: string) => {
    try {
      await hideWord(wordId, user?.id);
      toast.success("Słowo ukryte!");
    } catch {
      toast.error("Nie udało się ukryć słowa");
    }
  };

  const handleUnhideStatic = async (wordId: string) => {
    try {
      await unhideWord(wordId);
      toast.success("Słowo przywrócone!");
    } catch {
      toast.error("Nie udało się przywrócić słowa");
    }
  };

  const openEditStatic = (w: PolishWord) => {
    const override = overrides.get(w.id);
    setEditForm({
      word: override?.word || w.word,
      partOfSpeech: override?.part_of_speech || w.partOfSpeech,
      definition: override?.definition || w.definition,
      example: override?.example || w.example,
      etymology: override?.etymology || w.etymology || "",
      category: override?.category || w.category,
    });
    setEditingStatic(w);
  };

  const handleEditStaticSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatic || !editForm.word.trim() || !editForm.definition.trim()) return;
    setEditSubmitting(true);
    try {
      await saveOverride({
        word_id: editingStatic.id,
        word: editForm.word.trim(),
        part_of_speech: editForm.partOfSpeech.trim(),
        definition: editForm.definition.trim(),
        example: editForm.example.trim(),
        etymology: editForm.etymology.trim() || null,
        category: editForm.category,
        updated_by: user?.id || null,
      });
      toast.success("Słowo zaktualizowane!");
      setEditingStatic(null);
    } catch (err: any) {
      toast.error(err.message || "Nie udało się zaktualizować");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleResetOverride = async (wordId: string) => {
    try {
      await deleteOverride(wordId);
      toast.success("Przywrócono oryginał!");
    } catch {
      toast.error("Nie udało się przywrócić");
    }
  };

  const filteredStatic = words.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.definition.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGlobal = globalWords.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.definition.toLowerCase().includes(search.toLowerCase())
  );

  const visibleStaticCount = words.filter(w => !hiddenIds.has(w.id)).length;

  return (
    <div className="w-full max-w-lg mx-auto h-full min-h-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-1 pb-3 space-y-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Panel moderatora
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => handleTabChange("global")}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              tab === "global" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            Globalne ({globalWords.length})
          </button>
          <button
            onClick={() => handleTabChange("static")}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              tab === "static" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            Wbudowane ({visibleStaticCount}/{words.length})
          </button>
          <button
            onClick={() => handleTabChange("suggestions")}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              tab === "suggestions" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            <span className="flex items-center justify-center gap-1">
              <Inbox size={12} />
              Propozycje
            </span>
          </button>
        </div>

        {/* Search + Add */}
        {tab !== "suggestions" && (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Szukaj słowa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {tab === "global" && (
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setImportOpen(true)}
                  className="p-2 rounded-xl bg-secondary text-secondary-foreground cursor-pointer"
                  title="Importuj słowa"
                >
                  <Upload size={18} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setAddOpen(true)}
                  className="p-2 rounded-xl bg-primary text-primary-foreground cursor-pointer"
                >
                  <Plus size={18} />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Word list */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 px-1 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tab === "suggestions" ? (
          suggestionsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Ładowanie...</p>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Brak oczekujących propozycji</p>
          ) : (
            suggestions.map((s) => (
              <div key={s.id} className="p-3 rounded-xl bg-card border border-border space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{s.word}</span>
                      {s.part_of_speech && <span className="text-[10px] text-muted-foreground">{s.part_of_speech}</span>}
                    </div>
                    {s.definition && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.definition}</p>}
                    {s.example && <p className="text-xs text-muted-foreground/70 mt-0.5 italic line-clamp-1">{s.example}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => approveSuggestion(s)}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      title="Zatwierdź"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => rejectSuggestion(s)}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Odrzuć"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : tab === "global" ? (
          loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Ładowanie...</p>
          ) : filteredGlobal.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? "Brak wyników" : "Brak globalnych słów. Dodaj pierwsze!"}
            </p>
          ) : (
            filteredGlobal.map((w) => (
              <div key={w.id} className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{w.word}</span>
                    <span className="text-[10px] text-muted-foreground">{w.part_of_speech}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      w.difficulty === "beginner" ? "bg-green-500/15 text-green-600 dark:text-green-400" :
                      w.difficulty === "intermediate" ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" :
                      "bg-red-500/15 text-red-600 dark:text-red-400"
                    }`}>{
                      w.difficulty === "beginner" ? "łatwe" :
                      w.difficulty === "intermediate" ? "średnie" : "trudne"
                    }</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{w.definition}</p>
                </div>
                <button
                  onClick={() => handleDelete(w.id)}
                  className={`p-1.5 rounded-lg flex-shrink-0 transition-colors cursor-pointer ${
                    confirmDeleteId === w.id
                      ? "bg-destructive text-destructive-foreground"
                      : "text-muted-foreground hover:text-destructive hover:bg-secondary"
                  }`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )
        ) : (
          filteredStatic.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Brak wyników</p>
          ) : (
            filteredStatic.map((w) => {
              const isHidden = hiddenIds.has(w.id);
              const hasOverride = overrides.has(w.id);
              const override = overrides.get(w.id);
              const displayWord = override?.word || w.word;
              const displayDef = override?.definition || w.definition;
              const displayPos = override?.part_of_speech || w.partOfSpeech;

              return (
                <div
                  key={w.id}
                  className={`flex items-start gap-2 p-3 rounded-xl border border-border transition-opacity ${
                    isHidden ? "bg-muted/50 opacity-50" : "bg-card"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate">{displayWord}</span>
                      <span className="text-[10px] text-muted-foreground">{displayPos}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
                        {categories.find(c => c.value === (override?.category || w.category))?.label || w.category}
                      </span>
                      {hasOverride && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
                          edytowane
                        </span>
                      )}
                      {isHidden && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-destructive/15 text-destructive">
                          ukryte
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{displayDef}</p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditStatic(w)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors cursor-pointer"
                      title="Edytuj"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => isHidden ? handleUnhideStatic(w.id) : handleHideStatic(w.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isHidden
                          ? "text-primary hover:bg-secondary"
                          : "text-muted-foreground hover:text-destructive hover:bg-secondary"
                      }`}
                      title={isHidden ? "Przywróć" : "Ukryj"}
                    >
                      {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    {hasOverride && (
                      <button
                        onClick={() => handleResetOverride(w.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-accent-foreground hover:bg-secondary transition-colors cursor-pointer"
                        title="Przywróć oryginał"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Add word modal */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
            onClick={() => setAddOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  Dodaj globalne słowo
                </h2>
                <button onClick={() => setAddOpen(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAdd} className="p-5 space-y-3">
                {/* AI Generate section */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-primary">
                    <Sparkles size={14} />
                    Wygeneruj słowo przez AI
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Podpowiedź (opcjonalnie)"
                      value={aiHint}
                      onChange={(e) => setAiHint(e.target.value)}
                      className={`${inputClass} text-xs`}
                    />
                    <button
                      type="button"
                      onClick={handleAIGenerate}
                      disabled={aiGenerating}
                      className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium whitespace-nowrap cursor-pointer disabled:opacity-50"
                    >
                      {aiGenerating ? "..." : "Generuj"}
                    </button>
                  </div>
                </div>

                <input type="text" placeholder="Słowo *" value={form.word} onChange={(e) => setForm(f => ({ ...f, word: e.target.value }))} required maxLength={100} className={inputClass} />
                <input type="text" placeholder="Część mowy" value={form.part_of_speech} onChange={(e) => setForm(f => ({ ...f, part_of_speech: e.target.value }))} maxLength={50} className={inputClass} />
                <textarea placeholder="Definicja *" value={form.definition} onChange={(e) => setForm(f => ({ ...f, definition: e.target.value }))} required maxLength={500} rows={3} className={`${inputClass} resize-none`} />
                <input type="text" placeholder="Przykład użycia" value={form.example} onChange={(e) => setForm(f => ({ ...f, example: e.target.value }))} maxLength={300} className={inputClass} />
                <input type="text" placeholder="Etymologia (opcjonalnie)" value={form.etymology} onChange={(e) => setForm(f => ({ ...f, etymology: e.target.value }))} maxLength={200} className={inputClass} />
                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                  {editableCategories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <select value={form.difficulty} onChange={(e) => setForm(f => ({ ...f, difficulty: e.target.value }))} className={inputClass}>
                  {difficultyOptions.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={submitting || !form.word.trim() || !form.definition.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  <Plus size={16} />
                  {submitting ? "Dodawanie..." : "Dodaj słowo"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit static word modal */}
      <AnimatePresence>
        {editingStatic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
            onClick={() => setEditingStatic(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  Edytuj słowo wbudowane
                </h2>
                <button onClick={() => setEditingStatic(null)} className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleEditStaticSubmit} className="p-5 space-y-3">
                <input type="text" placeholder="Słowo *" value={editForm.word} onChange={(e) => setEditForm(f => ({ ...f, word: e.target.value }))} required maxLength={100} className={inputClass} />
                <input type="text" placeholder="Część mowy" value={editForm.partOfSpeech} onChange={(e) => setEditForm(f => ({ ...f, partOfSpeech: e.target.value }))} maxLength={50} className={inputClass} />
                <textarea placeholder="Definicja *" value={editForm.definition} onChange={(e) => setEditForm(f => ({ ...f, definition: e.target.value }))} required maxLength={500} rows={3} className={`${inputClass} resize-none`} />
                <input type="text" placeholder="Przykład użycia" value={editForm.example} onChange={(e) => setEditForm(f => ({ ...f, example: e.target.value }))} maxLength={300} className={inputClass} />
                <input type="text" placeholder="Etymologia (opcjonalnie)" value={editForm.etymology} onChange={(e) => setEditForm(f => ({ ...f, etymology: e.target.value }))} maxLength={200} className={inputClass} />
                <select value={editForm.category} onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                  {editableCategories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={editSubmitting || !editForm.word.trim() || !editForm.definition.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  <Pencil size={16} />
                  {editSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImportWordsDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
