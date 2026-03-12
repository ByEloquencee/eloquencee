import { motion } from "framer-motion";
import { Award, Star, Zap, Crown, Gem, BookOpen, Flame, Rocket, Heart, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Achievement {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  threshold: number;
  type: "words" | "streak";
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first-word", icon: Star, label: "Pierwszy krok", description: "Naucz się 1 słowa", threshold: 1, type: "words" },
  { id: "five-words", icon: BookOpen, label: "Początkujący", description: "Naucz się 5 słów", threshold: 5, type: "words" },
  { id: "ten-words", icon: Zap, label: "Na dobrej drodze", description: "Naucz się 10 słów", threshold: 10, type: "words" },
  { id: "twentyfive-words", icon: Award, label: "Ćwierćsetka", description: "Naucz się 25 słów", threshold: 25, type: "words" },
  { id: "fifty-words", icon: Rocket, label: "Półsetka", description: "Naucz się 50 słów", threshold: 50, type: "words" },
  { id: "hundred-words", icon: Crown, label: "Centurion", description: "Naucz się 100 słów", threshold: 100, type: "words" },
  { id: "twohundred-words", icon: Gem, label: "Erudyta", description: "Naucz się 200 słów", threshold: 200, type: "words" },
  { id: "fivehundred-words", icon: GraduationCap, label: "Mistrz słów", description: "Naucz się 500 słów", threshold: 500, type: "words" },
  { id: "streak-3", icon: Flame, label: "Zapał", description: "Seria 3 dni", threshold: 3, type: "streak" },
  { id: "streak-7", icon: Flame, label: "Tydzień mocy", description: "Seria 7 dni", threshold: 7, type: "streak" },
  { id: "streak-14", icon: Heart, label: "Nawyk", description: "Seria 14 dni", threshold: 14, type: "streak" },
  { id: "streak-30", icon: Crown, label: "Niezłomny", description: "Seria 30 dni", threshold: 30, type: "streak" },
];

interface AchievementsBadgesProps {
  totalWords: number;
  streak: number;
}

export function AchievementsBadges({ totalWords, streak }: AchievementsBadgesProps) {
  const earned = ACHIEVEMENTS.filter((a) =>
    a.type === "words" ? totalWords >= a.threshold : streak >= a.threshold
  );
  const locked = ACHIEVEMENTS.filter((a) =>
    a.type === "words" ? totalWords < a.threshold : streak < a.threshold
  );

  // Next milestone
  const nextWord = locked.find((a) => a.type === "words");
  const nextStreak = locked.find((a) => a.type === "streak");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">Osiągnięcia</span>
        <span className="text-[10px] text-muted-foreground">
          {earned.length}/{ACHIEVEMENTS.length}
        </span>
      </div>

      {/* Earned badges */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {earned.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 15,
              delay: i * 0.06,
            }}
            className="group relative flex flex-col items-center gap-1 p-2 rounded-xl bg-primary/10 border border-primary/20"
          >
            <motion.div
              whileHover={{ scale: 1.2, rotate: 10 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <a.icon size={20} className="text-primary" />
            </motion.div>
            <span className="text-[8px] font-medium text-foreground text-center leading-tight">
              {a.label}
            </span>

            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-foreground text-background text-[9px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {a.description}
            </div>
          </motion.div>
        ))}

        {/* Locked badges */}
        {locked.map((a) => (
          <div
            key={a.id}
            className="group relative flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/50 border border-border opacity-40"
          >
            <a.icon size={20} className="text-muted-foreground" />
            <span className="text-[8px] font-medium text-muted-foreground text-center leading-tight">
              {a.label}
            </span>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-foreground text-background text-[9px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {a.description}
            </div>
          </div>
        ))}
      </div>

      {/* Next milestones */}
      {(nextWord || nextStreak) && (
        <div className="space-y-1.5">
          {nextWord && (
            <NextMilestoneBar
              label={nextWord.label}
              description={nextWord.description}
              current={totalWords}
              target={nextWord.threshold}
            />
          )}
          {nextStreak && (
            <NextMilestoneBar
              label={nextStreak.label}
              description={nextStreak.description}
              current={streak}
              target={nextStreak.threshold}
            />
          )}
        </div>
      )}
    </div>
  );
}

function NextMilestoneBar({
  label,
  description,
  current,
  target,
}: {
  label: string;
  description: string;
  current: number;
  target: number;
}) {
  const percent = Math.min((current / target) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground truncate">
            {description}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums ml-1">
            {current}/{target}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-primary/50"
          />
        </div>
      </div>
    </div>
  );
}
