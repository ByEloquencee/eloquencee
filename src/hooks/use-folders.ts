import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Folder {
  id: string;
  name: string;
  icon: string;
  wordIds: string[];
}

export function useFolders() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);

  const fetchFolders = useCallback(async () => {
    if (!user) {
      setFolders([]);
      return;
    }
    const { data: foldersData } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!foldersData) return;

    const { data: wordsData } = await supabase
      .from("folder_words")
      .select("*")
      .eq("user_id", user.id);

    const wordsByFolder = new Map<string, string[]>();
    wordsData?.forEach((fw) => {
      const arr = wordsByFolder.get(fw.folder_id) || [];
      arr.push(fw.word_id);
      wordsByFolder.set(fw.folder_id, arr);
    });

    setFolders(
      foldersData.map((f) => ({
        id: f.id,
        name: f.name,
        icon: f.icon,
        wordIds: wordsByFolder.get(f.id) || [],
      }))
    );
  }, [user]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(
    async (name: string, icon: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("folders")
        .insert({ user_id: user.id, name, icon });
      if (error) throw error;
      await fetchFolders();
    },
    [user, fetchFolders]
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      const { error } = await supabase.from("folders").delete().eq("id", folderId);
      if (error) throw error;
      await fetchFolders();
    },
    [fetchFolders]
  );

  const toggleWordInFolder = useCallback(
    async (folderId: string, wordId: string) => {
      if (!user) return;
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) return;

      const isIn = folder.wordIds.includes(wordId);

      // Optimistic update
      setFolders((prev) =>
        prev.map((f) =>
          f.id === folderId
            ? {
                ...f,
                wordIds: isIn
                  ? f.wordIds.filter((id) => id !== wordId)
                  : [...f.wordIds, wordId],
              }
            : f
        )
      );

      if (isIn) {
        await supabase
          .from("folder_words")
          .delete()
          .eq("folder_id", folderId)
          .eq("word_id", wordId);
      } else {
        await supabase
          .from("folder_words")
          .insert({ folder_id: folderId, word_id: wordId, user_id: user.id });
      }
    },
    [user, folders]
  );

  const isWordInFolder = useCallback(
    (folderId: string, wordId: string) => {
      const folder = folders.find((f) => f.id === folderId);
      return folder?.wordIds.includes(wordId) ?? false;
    },
    [folders]
  );

  // Built-in "Zapisane" folder
  const savedFolder = folders.find((f) => f.name === "Zapisane" && f.icon === "bookmark");

  const ensureSavedFolder = useCallback(async () => {
    if (!user) return null;
    const existing = folders.find((f) => f.name === "Zapisane" && f.icon === "bookmark");
    if (existing) return existing.id;
    const { data, error } = await supabase
      .from("folders")
      .insert({ user_id: user.id, name: "Zapisane", icon: "bookmark" })
      .select("id")
      .single();
    if (error) throw error;
    await fetchFolders();
    return data.id;
  }, [user, folders, fetchFolders]);

  const toggleSaved = useCallback(
    async (wordId: string) => {
      if (!user) return;
      let folderId = savedFolder?.id;
      if (!folderId) {
        folderId = await ensureSavedFolder();
      }
      if (!folderId) return;
      // toggleWordInFolder uses folders state which may not have the new folder yet
      // so we call it which will do optimistic update
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        await toggleWordInFolder(folderId, wordId);
      } else {
        // Folder was just created, add word directly
        setFolders((prev) =>
          prev.map((f) =>
            f.id === folderId ? { ...f, wordIds: [...f.wordIds, wordId] } : f
          )
        );
        await supabase
          .from("folder_words")
          .insert({ folder_id: folderId, word_id: wordId, user_id: user.id });
      }
    },
    [user, savedFolder, ensureSavedFolder, toggleWordInFolder, folders]
  );

  const isWordSaved = useCallback(
    (wordId: string) => {
      return savedFolder?.wordIds.includes(wordId) ?? false;
    },
    [savedFolder]
  );

  // Expose folders WITHOUT the built-in "Zapisane" folder
  const publicFolders = folders.filter((f) => !(f.name === "Zapisane" && f.icon === "bookmark"));

  return {
    folders: publicFolders,
    createFolder,
    deleteFolder,
    toggleWordInFolder,
    isWordInFolder,
    refetch: fetchFolders,
    toggleSaved,
    isWordSaved,
    savedWordIds: savedFolder?.wordIds ?? [],
    savedCount: savedFolder?.wordIds.length ?? 0,
  };
}
