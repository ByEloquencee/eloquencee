import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useModerator } from "@/hooks/use-moderator";

export interface AdminSuggestion {
  word: string;
  part_of_speech: string;
  definition: string;
  example: string;
  etymology: string;
}

const STORAGE_KEY = "admin-word-suggestions-v1";
const TARGET_SIZE = 10;
const TOP_UP_DELAY_MS = 1500;

const readQueue = (): AdminSuggestion[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (q: AdminSuggestion[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
  } catch {
    // noop
  }
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function useAdminSuggestions() {
  const { isModerator } = useModerator();
  const [queue, setQueue] = useState<AdminSuggestion[]>(() => readQueue());
  const runningRef = useRef(false);
  const stoppedRef = useRef(false);

  // persist queue
  useEffect(() => {
    writeQueue(queue);
  }, [queue]);

  const generateOne = useCallback(async (existingWords: Set<string>): Promise<AdminSuggestion | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-word", {
        body: { difficulty: "advanced" },
      });
      if (error) return null;
      if (!data || data.error) return null;
      const candidate = data as AdminSuggestion;
      if (!candidate.word || !candidate.definition) return null;
      if (existingWords.has(norm(candidate.word))) return null;
      return candidate;
    } catch {
      return null;
    }
  }, []);

  const topUp = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      // fetch existing globals + custom suggested? Just globals to dedupe.
      const { data: globals } = await (supabase
        .from("global_words" as any)
        .select("word")
        .limit(2000) as any);
      const existingWords = new Set(
        ((globals as any[]) || []).map((r: any) => norm(r.word)),
      );

      while (!stoppedRef.current) {
        const current = readQueue();
        // also dedupe against current queue
        current.forEach((s) => existingWords.add(norm(s.word)));
        if (current.length >= TARGET_SIZE) break;

        const next = await generateOne(existingWords);
        if (next) {
          existingWords.add(norm(next.word));
          const updated = [...readQueue(), next];
          writeQueue(updated);
          setQueue(updated);
        }
        await new Promise((r) => setTimeout(r, TOP_UP_DELAY_MS));
      }
    } finally {
      runningRef.current = false;
    }
  }, [generateOne]);

  // Start background top-up when moderator
  useEffect(() => {
    if (!isModerator) return;
    stoppedRef.current = false;
    topUp();
    return () => {
      stoppedRef.current = true;
    };
  }, [isModerator, topUp]);

  // Also retrigger when queue drops
  useEffect(() => {
    if (!isModerator) return;
    if (queue.length < TARGET_SIZE && !runningRef.current) {
      topUp();
    }
  }, [queue.length, isModerator, topUp]);

  const consume = useCallback(() => {
    setQueue((prev) => {
      const updated = prev.slice(1);
      writeQueue(updated);
      return updated;
    });
  }, []);

  return {
    current: queue[0] ?? null,
    queueSize: queue.length,
    targetSize: TARGET_SIZE,
    consume,
    isReady: queue.length > 0,
  };
}
