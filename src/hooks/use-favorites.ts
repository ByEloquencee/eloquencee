import { useState, useEffect, useCallback } from "react";

const FAVORITES_KEY = "slownik-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((wordId: string) => {
    setFavorites((prev) =>
      prev.includes(wordId)
        ? prev.filter((id) => id !== wordId)
        : [...prev, wordId]
    );
  }, []);

  const isFavorite = useCallback(
    (wordId: string) => favorites.includes(wordId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
