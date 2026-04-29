// Heurystyczna ocena trudności słowa: długość + rzadkość liter (np. q, ż, ź, x).
// Zwraca jeden z poziomów: 'beginner' | 'intermediate' | 'advanced'.

const RARE_LETTERS = new Set(["q", "x", "v", "ź", "ż", "ć", "ń", "ó", "ą", "ę", "ł", "ś"]);
const VERY_RARE_PATTERNS = [/rz/i, /szcz/i, /trz/i, /chrz/i, /ksz/i, /pszcz/i];

export function estimateDifficulty(word: string): "beginner" | "intermediate" | "advanced" {
  const w = (word || "").trim().toLowerCase();
  if (!w) return "intermediate";

  let score = 0;

  // Długość słowa (im dłuższe, tym trudniejsze)
  const len = w.replace(/\s+/g, "").length;
  if (len <= 6) score += 0;
  else if (len <= 9) score += 2;
  else if (len <= 12) score += 4;
  else score += 6;

  // Liczba sylab (uproszczone — samogłoski)
  const syllables = (w.match(/[aeiouyąęó]/gi) || []).length;
  if (syllables >= 5) score += 2;
  else if (syllables >= 4) score += 1;

  // Rzadkie litery
  let rareCount = 0;
  for (const ch of w) if (RARE_LETTERS.has(ch)) rareCount++;
  if (rareCount >= 4) score += 3;
  else if (rareCount >= 2) score += 2;
  else if (rareCount >= 1) score += 1;

  // Trudne zbitki spółgłoskowe
  for (const pat of VERY_RARE_PATTERNS) {
    if (pat.test(w)) { score += 1; break; }
  }

  // Wieloczłonowe wyrażenia
  if (w.includes(" ")) score += 1;

  if (score <= 2) return "beginner";
  if (score <= 5) return "intermediate";
  return "advanced";
}
