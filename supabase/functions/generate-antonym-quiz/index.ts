import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PoolWord {
  word: string;
  definition: string;
  part_of_speech?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { words, pool } = await req.json() as { words: PoolWord[]; pool: PoolWord[] };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!words || words.length < 4 || !pool || pool.length < 8) {
      return new Response(JSON.stringify({ error: "Za mało słów do wygenerowania quizu antonimów." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit prompt size
    const candidatePool = pool.slice(0, 250);
    const focusWords = words.slice(0, 30);

    const focusList = focusWords.map((w, i) => `${i}. ${w.word}${w.part_of_speech ? ` (${w.part_of_speech})` : ""} — ${w.definition}`).join("\n");
    const poolList = candidatePool.map((w) => `- ${w.word}${w.part_of_speech ? ` (${w.part_of_speech})` : ""}`).join("\n");

    const systemPrompt = `Jesteś ekspertem od języka polskiego. Otrzymasz listę FOCUS — słowa z aplikacji wraz z definicjami.

Twoim zadaniem jest stworzenie do 8 pytań quizowych o ANTONIMY (przeciwieństwa).

JAK MA DZIAŁAĆ PYTANIE:
- Pokazujemy użytkownikowi DEFINICJĘ słowa z FOCUS (samo słowo jest ukryte).
- Użytkownik wybiera spośród 4 opcji PRZECIWIEŃSTWO tego słowa.
- Przykład: słowo "Dywersyfikacja" (definicja: "rozproszenie inwestycji w celu zmniejszenia ryzyka") → poprawna odpowiedź: "Koncentracja", dystraktory: np. "Ekspansja", "Stagnacja", "Akumulacja".

ZASADY:
- WYBIERZ ze słów FOCUS tylko te, które mają WYRAŹNY, jednoznaczny antonim w języku polskim. Słowa bez sensownego przeciwieństwa POMIŃ (np. nazwy konkretnych rzeczy, terminy techniczne bez opozycji).
- Antonim oraz 3 dystraktory WYMYŚLASZ samodzielnie — to mają być prawdziwe, poprawne polskie słowa (NIE muszą występować w aplikacji).
- Antonim musi być naprawdę przeciwieństwem semantycznym pytanego słowa.
- Dystraktory MUSZĄ być wiarygodne: tej samej części mowy co antonim, podobne tematycznie/stylistycznie, ale NIE będące przeciwieństwem pytanego słowa. Nie mogą być synonimami pytanego słowa ani jego antonimu.
- Wszystkie 4 opcje MUSZĄ być w IDENTYCZNEJ formie gramatycznej:
  · rzeczowniki — wszystkie w mianowniku liczby pojedynczej, ten sam rodzaj jeśli możliwe
  · przymiotniki — ten sam rodzaj, liczba i przypadek
  · czasowniki — wszystkie w bezokresoniku (lub wszystkie w tej samej formie osobowej)
- Opcje powinny być podobnej długości — poprawna odpowiedź NIE może wyróżniać się wizualnie (np. wszystkie 1-słowne, zbliżona liczba znaków).
- Każde pytanie dotyczy INNEGO słowa z FOCUS.

Odpowiedz WYŁĄCZNIE w formacie JSON (bez markdown, bez komentarzy):
{
  "questions": [
    {
      "question_word": "Dywersyfikacja",
      "question_definition": "rozproszenie inwestycji w celu zmniejszenia ryzyka",
      "options": ["Koncentracja", "Ekspansja", "Stagnacja", "Akumulacja"],
      "correct": 0,
      "explanation": "Koncentracja to skupienie zasobów w jednym miejscu — dokładne przeciwieństwo dywersyfikacji."
    }
  ]
}

correct = indeks (0-3) antonimu w options. Wymieszaj kolejność — antonim NIE zawsze na pozycji 0.
Zwróć od 4 do 8 pytań (preferuj 8, jeśli FOCUS na to pozwala).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `FOCUS:\n${focusList}\n\nWygeneruj pytania o antonimy zgodnie z zasadami.` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Zbyt wiele zapytań." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Wyczerpano limit AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let result: { questions?: Array<{ question_word: string; question_definition: string; options: string[]; correct: number; explanation: string }> } | null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      result = null;
    }

    if (!result?.questions?.length) {
      return new Response(JSON.stringify({ error: "Nie udało się wygenerować quizu." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate: 4 unique options, valid correct index, non-empty fields, dedupe questions
    const norm = (s: string) => s.trim().toLowerCase();
    const seen = new Set<string>();
    const cleaned = result.questions.filter((q) => {
      if (!q || !Array.isArray(q.options) || q.options.length !== 4) return false;
      if (typeof q.correct !== "number" || q.correct < 0 || q.correct > 3) return false;
      if (!q.question_word?.trim() || !q.question_definition?.trim()) return false;
      const optKeys = q.options.map(norm);
      if (optKeys.some((o) => !o)) return false;
      if (new Set(optKeys).size !== 4) return false;
      // Antonim nie może być tym samym słowem co pytane
      if (optKeys[q.correct] === norm(q.question_word)) return false;
      const key = norm(q.question_word);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (cleaned.length === 0) {
      return new Response(JSON.stringify({ error: "Brak prawidłowych pytań." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ questions: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-antonym-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
