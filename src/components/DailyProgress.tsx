import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface DailyProgressProps {
  current: number;
  goal: number;
}

export function DailyProgress({ current, goal }: DailyProgressProps) {
  const clamped = Math.min(current, goal);
  const done = clamped >= goal;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium">
      <Flame size={14} className={done ? "text-primary" : "text-muted-foreground"} />
      <span className="tabular-nums">
        {clamped}/{goal}
      </span>
      {done && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-xs"
        >
          🎉
        </motion.span>
      )}
    </div>
  );
}
