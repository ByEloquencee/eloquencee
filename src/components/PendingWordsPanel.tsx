import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  Pencil,
  RefreshCw,
  Trash2,
  Loader2,
  ClipboardCheck,
  Filter,
} from "lucide-react";
import { usePendingWords, type PendingWord, type PendingStatusFilter } from "@/hooks/use-pending-words";
import { ChatGPTPromptDialog } from "@/components/ChatGPTPromptDialog";
import { toast } from "sonner";

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const STATUS_LABEL: Record<PendingStatusFilter, string> = {
  pending: "Oczekujące",
  approved: "Zatwierdzone",
  rejected: "Odrzucone",
  all: "Wszystkie",
};

function ConfidenceBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-[10px] text-muted-foreground">—</span>;
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="flex items-center gap-1.5 min-w-[60px]">
      <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">{pct}%</span>
    </div>
  );
}

function StatusBadge({ status }: { status: PendingWord["verification_status"] }) {
  const styles =
    status === "approved"
      ? "bg-primary/15 text-primary"
      : status === "rejected"
        ? "bg-destructive/15 text-destructive"
        : "bg-secondary text-secondary-foreground";
  const label = status === "approved" ? "✓ zatwierdzone" : status === "rejected" ? "✕ odrzucone" : "● oczekujące";
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${styles}`}>{label}</span>;
}

interface EditState {
  word: string;
  part_of_speech: string;
  definition: string;
  simplified_definition: string;
  example_sentence: string;
  etymology: string;
  stylistic_tags: string;
  category: string;
  difficulty_level: string;
}

export function PendingWordsPanel() {
  const [status, setStatus] = useState<PendingStatusFilter>("pending");
  const { pending, loading, approve, reject, update, remove, regenerate, refetch } = usePendingWords(status);

  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState<string>("");
  const [batchOpen, setBatchOpen] = useState(false);
  const [editing, setEditing] = useState<PendingWord | null>(null);
  const [editForm, setEditForm] = useState<EditState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const batches = useMemo(() => {
    const map = new Map<string, string>();
    pending.forEach((p) => {
      if (p.batch_id) map.set(p.batch_id, p.batch_prompt || p.batch_id);
    });
    return Array.from(map.entries());
  }, [pending]);

  const filtered = pending.filter((p) => {
    if (batchFilter && p.batch_id !== batchFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!p.word.toLowerCase().includes(s) && !p.definition.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const handleApprove = async (p: PendingWord) => {
    setBusyId(p.id);
    try {
      await approve(p.id);
      toast.success(`"${p.word}" opublikowane!`);
    } catch (e: any) {
      toast.error(e.message || "Nie udało się zatwierdzić");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (p: PendingWord) => {
    setBusyId(p.id);
    try {
      await reject(p.id);
      toast.success("Odrzucono");
    } catch (e: any) {
      toast.error(e.message || "Nie udało się odrzucić");
    } finally {
      setBusyId(null);
    }
  };

  const handleRegenerate = async (p: PendingWord) => {
    setBusyId(p.id);
    const t = toast.loading(`Regeneruję "${p.word}"...`);
    try {
      await regenerate(p.id);
      toast.success("Zregenerowano!", { id: t });
    } catch (e: any) {
      toast.error(e.message || "Nie udało się zregenerować", { id: t });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (p: PendingWord) => {
    setBusyId(p.id);
    try {
      await remove(p.id);
      toast.success("Usunięto z kolejki");
    } catch (e: any) {
      toast.error(e.message || "Nie udało się usunąć");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (p: PendingWord) => {
    setEditing(p);
    setEditForm({
      word: p.word,
      part_of_speech: p.part_of_speech,
      definition: p.definition,
      simplified_definition: p.simplified_definition,
      example_sentence: p.example_sentence,
      etymology: p.etymology || "",
      stylistic_tags: p.stylistic_tags.join(", "),
      category: p.category,
      difficulty_level: p.difficulty_level,
    });
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editForm) return;
    try {
      await update(editing.id, {
        word: editForm.word.trim(),
        part_of_speech: editForm.part_of_speech.trim(),
        definition: editForm.definition.trim(),
        simplified_definition: editForm.simplified_definition.trim(),
        example_sentence: editForm.example_sentence.trim(),
        etymology: editForm.etymology.trim() || null,
        stylistic_tags: editForm.stylistic_tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        category: editForm.category,
        difficulty_level: editForm.difficulty_level,
      } as any);
      toast.success("Zapisano");
      setEditing(null);
      setEditForm(null);
    } catch (e: any) {
      toast.error(e.message || "Nie udało się zapisać");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto h-full min-h-0 flex flex-col overflow-hidden">
      <div className="px-1 pb-3 space-y-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={18} className="text-primary" />
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Kolejka moderacji
          </h2>
          <button
            onClick={() => setBatchOpen(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Sparkles size={12} />
            Generuj partię
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {(Object.keys(STATUS_LABEL) as PendingStatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer ${
                status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {/* Search + batch */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Szukaj słowa lub definicji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} text-xs`}
          />
          {batches.length > 0 && (
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="px-2 py-2 rounded-xl bg-secondary border border-border text-xs cursor-pointer max-w-[140px]"
              title="Filtruj wg partii"
            >
              <option value="">Wszystkie partie</option>
              {batches.map(([id, p]) => (
                <option key={id} value={id}>
                  {p.length > 20 ? p.slice(0, 20) + "..." : p}
                </option>
              ))}
            </select>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Filter size={10} />
            {filtered.length} wpis(ów)
          </p>
        )}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 px-1 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Ładowanie...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {status === "pending" ? 'Kolejka pusta. Kliknij "Generuj partię" aby zacząć.' : "Brak wyników"}
          </p>
        ) : (
          filtered.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-card border border-border space-y-2"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold truncate">{p.word}</span>
                    {p.part_of_speech && (
                      <span className="text-[10px] text-muted-foreground">{p.part_of_speech}</span>
                    )}
                    <StatusBadge status={p.verification_status} />
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
                      {p.dictionary_source}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.definition}</p>
                  {p.simplified_definition && (
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-1 italic">
                      Prosto: {p.simplified_definition}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap mt-1.5">
                    <ConfidenceBar value={p.ai_confidence_score} />
                    {p.stylistic_tags.slice(0, 4).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0">
                  {p.verification_status === "pending" && (
                    <>
                      <button
                        disabled={busyId === p.id}
                        onClick={() => handleApprove(p)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50"
                        title="Zatwierdź i opublikuj"
                      >
                        {busyId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                      <button
                        disabled={busyId === p.id}
                        onClick={() => handleReject(p)}
                        className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
                        title="Odrzuć"
                      >
                        <X size={14} />
                      </button>
                      <button
                        disabled={busyId === p.id}
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
                        title="Edytuj"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        disabled={busyId === p.id}
                        onClick={() => handleRegenerate(p)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
                        title="Regeneruj przez AI"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </>
                  )}
                  <button
                    disabled={busyId === p.id}
                    onClick={() => handleDelete(p)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
                    title="Usuń wpis"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <GenerateBatchDialog open={batchOpen} onClose={() => setBatchOpen(false)} onDone={refetch} />

      {/* Edit modal */}
      <AnimatePresence>
        {editing && editForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
            onClick={() => {
              setEditing(null);
              setEditForm(null);
            }}
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
                  Edytuj wpis
                </h2>
                <button
                  onClick={() => {
                    setEditing(null);
                    setEditForm(null);
                  }}
                  className="p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={submitEdit} className="p-5 space-y-3">
                <input
                  type="text"
                  value={editForm.word}
                  onChange={(e) => setEditForm({ ...editForm, word: e.target.value })}
                  placeholder="Słowo"
                  className={inputClass}
                  required
                />
                <input
                  type="text"
                  value={editForm.part_of_speech}
                  onChange={(e) => setEditForm({ ...editForm, part_of_speech: e.target.value })}
                  placeholder="Część mowy"
                  className={inputClass}
                />
                <textarea
                  value={editForm.definition}
                  onChange={(e) => setEditForm({ ...editForm, definition: e.target.value })}
                  placeholder="Definicja"
                  className={inputClass}
                  rows={3}
                  required
                />
                <textarea
                  value={editForm.simplified_definition}
                  onChange={(e) => setEditForm({ ...editForm, simplified_definition: e.target.value })}
                  placeholder="Uproszczona definicja"
                  className={inputClass}
                  rows={2}
                />
                <textarea
                  value={editForm.example_sentence}
                  onChange={(e) => setEditForm({ ...editForm, example_sentence: e.target.value })}
                  placeholder="Przykład"
                  className={inputClass}
                  rows={2}
                />
                <input
                  type="text"
                  value={editForm.etymology}
                  onChange={(e) => setEditForm({ ...editForm, etymology: e.target.value })}
                  placeholder="Etymologia"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={editForm.stylistic_tags}
                  onChange={(e) => setEditForm({ ...editForm, stylistic_tags: e.target.value })}
                  placeholder="Tagi (oddziel przecinkami)"
                  className={inputClass}
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Zapisz
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
