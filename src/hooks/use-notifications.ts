import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { words as staticWords, type PolishWord } from "@/data/words";
import { useProfile } from "@/hooks/use-profile";
import { useGlobalWords } from "@/hooks/use-global-words";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type NotificationSettings = {
  enabled: boolean;
  hour1: number;
  hour2: number | null;
};

const NOTIF_PREFIX = 10000;
const SCHEDULE_DAYS = 30;

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

function pickWordsForUser(
  pool: PolishWord[],
  preferred: string[],
  count: number,
): PolishWord[] {
  const filtered = preferred.length
    ? pool.filter((w) => preferred.includes(w.category))
    : pool;
  const source = filtered.length ? filtered : pool;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  const result: PolishWord[] = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

function buildBody(word: PolishWord): string {
  const def = word.definition.split(".")[0].trim();
  const example = word.example.split("\n")[0].replace(/^\d+\.\s*/, "").trim();
  return `${def}.\n„${example}"`;
}

export function useNotifications() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { globalWords } = useGlobalWords();
  const [permissionGranted, setPermissionGranted] = useState(false);

  const settings: NotificationSettings = {
    enabled: profile?.notifications_enabled ?? false,
    hour1: profile?.notification_hour_1 ?? 8,
    hour2: profile?.notification_hour_2 ?? null,
  };

  useEffect(() => {
    if (!isNativePlatform()) return;
    LocalNotifications.checkPermissions().then((res) => {
      setPermissionGranted(res.display === "granted");
    }).catch(() => {});
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNativePlatform()) return false;
    const res = await LocalNotifications.requestPermissions();
    const granted = res.display === "granted";
    setPermissionGranted(granted);
    return granted;
  }, []);

  const cancelAll = useCallback(async () => {
    if (!isNativePlatform()) return;
    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter((n) => n.id >= NOTIF_PREFIX);
    if (ours.length) {
      await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
    }
  }, []);

  const scheduleNotifications = useCallback(
    async (override?: NotificationSettings) => {
      if (!isNativePlatform()) return;
      const cfg = override ?? settings;
      await cancelAll();
      if (!cfg.enabled) return;

      const hours = [cfg.hour1, cfg.hour2].filter((h): h is number => h !== null && h !== undefined);
      if (!hours.length) return;

      const pool: PolishWord[] = [
        ...staticWords,
        ...globalWords.map((w) => ({
          id: w.id,
          word: w.word,
          partOfSpeech: w.part_of_speech,
          definition: w.definition,
          example: w.example,
          etymology: w.etymology ?? undefined,
          category: w.category as PolishWord["category"],
        })),
      ];

      const preferred = profile?.preferred_categories ?? [];
      const totalCount = SCHEDULE_DAYS * hours.length;
      const wordsToUse = pickWordsForUser(pool, preferred, totalCount);

      const now = new Date();
      const notifications = [];
      let idx = 0;

      for (let day = 0; day < SCHEDULE_DAYS; day++) {
        for (const hour of hours) {
          const at = new Date(now);
          at.setDate(at.getDate() + day);
          at.setHours(hour, 0, 0, 0);
          if (at.getTime() <= now.getTime()) continue;

          const w = wordsToUse[idx];
          notifications.push({
            id: NOTIF_PREFIX + idx,
            title: `📖 ${w.word}`,
            body: buildBody(w),
            schedule: { at },
            sound: undefined,
            extra: { wordId: w.id },
          });
          idx++;
        }
      }

      if (notifications.length) {
        await LocalNotifications.schedule({ notifications });
      }
    },
    [settings, cancelAll, globalWords, profile?.preferred_categories],
  );

  const saveSettings = useCallback(
    async (next: NotificationSettings) => {
      if (!user) return;
      if (next.enabled && isNativePlatform()) {
        const granted = permissionGranted || (await requestPermission());
        if (!granted) {
          throw new Error("PERMISSION_DENIED");
        }
      }
      await updateProfile({
        notifications_enabled: next.enabled,
        notification_hour_1: next.hour1,
        notification_hour_2: next.hour2,
      });
      await scheduleNotifications(next);
    },
    [user, updateProfile, scheduleNotifications, permissionGranted, requestPermission],
  );

  // Refresh schedule on app focus when enabled
  useEffect(() => {
    if (!isNativePlatform() || !settings.enabled) return;
    const handler = () => {
      scheduleNotifications().catch(() => {});
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") handler();
    });
    return () => document.removeEventListener("visibilitychange", handler);
  }, [settings.enabled, scheduleNotifications]);

  const sendTestNotification = useCallback(async () => {
    if (!isNativePlatform()) {
      throw new Error("NOT_NATIVE");
    }
    const granted = permissionGranted || (await requestPermission());
    if (!granted) {
      throw new Error("PERMISSION_DENIED");
    }

    const pool: PolishWord[] = [
      ...staticWords,
      ...globalWords.map((w) => ({
        id: w.id,
        word: w.word,
        partOfSpeech: w.part_of_speech,
        definition: w.definition,
        example: w.example,
        etymology: w.etymology ?? undefined,
        category: w.category as PolishWord["category"],
      })),
    ];
    const preferred = profile?.preferred_categories ?? [];
    const [w] = pickWordsForUser(pool, preferred, 1);
    const at = new Date(Date.now() + 5000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 99999,
          title: `📖 ${w.word}`,
          body: buildBody(w),
          schedule: { at },
          extra: { wordId: w.id, test: true },
        },
      ],
    });
  }, [permissionGranted, requestPermission, globalWords, profile?.preferred_categories]);

  return {
    settings,
    isNative: isNativePlatform(),
    permissionGranted,
    saveSettings,
    scheduleNotifications,
    cancelAll,
    sendTestNotification,
  };
}
