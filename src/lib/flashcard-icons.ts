import {
  BookOpen, Brain, Globe, GraduationCap, Languages, Lightbulb,
  Music, Palette, Calculator, Atom, Heart, Star,
  Flame, Zap, Trophy, Target, Puzzle, Leaf, Coffee, Rocket
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const FLASHCARD_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "book-open", icon: BookOpen },
  { name: "brain", icon: Brain },
  { name: "globe", icon: Globe },
  { name: "graduation-cap", icon: GraduationCap },
  { name: "languages", icon: Languages },
  { name: "lightbulb", icon: Lightbulb },
  { name: "music", icon: Music },
  { name: "palette", icon: Palette },
  { name: "calculator", icon: Calculator },
  { name: "atom", icon: Atom },
  { name: "heart", icon: Heart },
  { name: "star", icon: Star },
  { name: "flame", icon: Flame },
  { name: "zap", icon: Zap },
  { name: "trophy", icon: Trophy },
  { name: "target", icon: Target },
  { name: "puzzle", icon: Puzzle },
  { name: "leaf", icon: Leaf },
  { name: "coffee", icon: Coffee },
  { name: "rocket", icon: Rocket },
];

export function getFlashcardIcon(name: string): LucideIcon {
  return FLASHCARD_ICONS.find((i) => i.name === name)?.icon || BookOpen;
}
