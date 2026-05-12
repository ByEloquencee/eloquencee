import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, X, Search } from "lucide-react";
import { toast } from "sonner";
import type { PolishWord } from "@/data/words";
import { supabase } from "@/integrations/supabase/client";

interface LevelWordsEditorProps {
  packId: string;
  packLabel: string;
  level: number;
  pool: PolishWord[]; // wszystkie słowa paczki (do wyboru)
  onClose: () => void;
}

interface Row {
  id: string;
  word_id: string;
  position: number;
}

export function LevelWordsEditor({ packId, packLabel, level, pool, onClose }: LevelWordsEditorProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  const wordById = useMemo(() => {
    const m = new Map<string, PolishWord>();
    pool.forEach((w) => m.set(w.id, w));
    return m;
  }, [pool]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pack_level_words")
      .select("id, word_id, position")
      .eq("pack_id", packId)
      .eq("level", level)
      .order("position", { ascending: true });
    if (error) {
      toast.error("Nie udało się wczytać słów poziomu");
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, level]);

  const usedIds = new Set(rows.map((r) => r.word_id));

  const filteredAvailable = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool
      .filter((w) => !usedIds.has(w.id))
      .filter(
        (w) =>
          !q ||
          w.word.toLowerCase().includes(q) ||
          w.definition.toLowerCase().includes(q),
      )
      .slice(0, 60);
  }, [pool, usedIds, query]);

  const handleAdd = async (wordId: string) => {
    const nextPos = rows.length;
    const { error } = await supabase.from("pack_level_words").insert({
      pack_id: packId,
      level,
      word_id: wordId,
      position: nextPos,
    });
    if (error) {
      toast.error("Nie udało się dodać słowa");
      return;
    }
    toast.success("Dodano");
    load();
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("pack_level_words").delete().eq("id", id);
    if (error) {
      toast.error("Nie udało się usunąć");
      return;
    }
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-background flex flex-col"
    >
      {/* Nagłówek */}
      <div className="flex items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),12px)] pb-3 border-b border-foreground/5">
        <button
          onClick={onClose}
          aria-label="Wstecz"
          className="h-9 w-9 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {packLabel}
          </p>
          <h2
            className="text-foreground text-base font-semibold truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Edycja poziomu {level}
          </h2>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="h-9 px-3 flex items-center gap-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          {adding ? "Gotowe" : "Dodaj"}
        </button>
      </div>

      {/* Treść */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="mx-auto w-full max-w-md px-4 py-4">
          {/* Lista przypisanych słów */}
          {!adding && (
            <>
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Ładowanie…</p>
              ) : rows.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground mb-2">
                    Brak przypisanych słów do tego poziomu.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quiz użyje wtedy losowych słów z paczki.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {rows.map((r, i) => {
                    const w = wordById.get(r.word_id);
                    return (
                      <li
                        key={r.id}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-foreground/10"
                      >
                        <span className="text-xs text-muted-foreground tabular-nums pt-0.5 w-5 text-right">
                          {i + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm text-foreground truncate"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {w?.word ?? r.word_id}
                          </p>
                          {w && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {w.definition}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(r.id)}
                          aria-label="Usuń"
                          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-full"
                        >
                          <X size={16} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {/* Tryb dodawania */}
          {adding && (
            <>
              <div className="relative mb-3">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Szukaj słowa…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
                />
              </div>
              {filteredAvailable.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Brak dostępnych słów.
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredAvailable.map((w) => (
                    <li key={w.id}>
                      <button
                        onClick={() => handleAdd(w.id)}
                        className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border border-foreground/10 hover:bg-secondary/40 transition-colors text-left"
                      >
                        <Plus size={16} className="text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm text-foreground truncate"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {w.word}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {w.definition}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
