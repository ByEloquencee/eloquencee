import { useState, useCallback } from "react";

const MASTERED_KEY = "eloquencee-mastered-words";

function loadMastered(): number {
  try {
    return JSON.parse(localStorage.getItem(MASTERED_KEY) || "0");
  } catch {
    return 0;
  }
}

export function useMasteredWords() {
  const [masteredCount, setMasteredCount] = useState(loadMastered);

  const addMastered = useCallback((count: number) => {
    setMasteredCount((prev) => {
      const next = prev + count;
      localStorage.setItem(MASTERED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { masteredCount, addMastered };
}
