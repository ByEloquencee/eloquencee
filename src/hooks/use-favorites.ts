import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const FAVORITES_KEY = "eloquencee-favorites";

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync from cloud when user logs in
  useEffect(() => {
    if (!user) return;
    supabase
      .from("favorites")
      .select("word_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const cloudFavs = data.map((f) => f.word_id);
          setFavorites((prev) => {
            const merged = Array.from(new Set([...prev, ...cloudFavs]));
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      });
  }, [user]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback(
    async (wordId: string) => {
      const isFav = favorites.includes(wordId);
      const newFavs = isFav
        ? favorites.filter((id) => id !== wordId)
        : [...favorites, wordId];
      setFavorites(newFavs);

      if (user) {
        if (isFav) {
          await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("word_id", wordId);
        } else {
          await supabase
            .from("favorites")
            .insert({ user_id: user.id, word_id: wordId });
        }
      }
    },
    [favorites, user]
  );

  const isFavorite = useCallback(
    (wordId: string) => favorites.includes(wordId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
