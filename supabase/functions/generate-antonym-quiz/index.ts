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

    const systemPrompt = `Jesteś ekspertem od języka polskiego. Otrzymasz dwie listy:
1) FOCUS — słowa kandydaci na pytania (z definicjami).
2) POOL — pełna pula DOSTĘPNYCH słów aplikacji (tylko te wolno użyć jako odpowiedzi i dystraktory).

Twoim zadaniem jest stworzenie do 8 pytań quizowych o ANTONIMY (przeciwieństwa).

ABSOLUTNE ZASADY:
- Antonim ORAZ wszystkie 3 dystraktory MUSZĄ pochodzić z POOL — zacytuj je dokładnie tak, jak występują w POOL (ta sama pisownia, ta sama forma).
- NIGDY nie wymyślaj nowych słów. Jeśli dla danego słowa FOCUS nie ma dobrego antonimu w POOL — POMIŃ to słowo.
- Wszystkie 4 opcje (antonim + 3 dystraktory) MUSZĄ być w IDENTYCZNEJ formie gramatycznej i tej samej części mowy.
  · Jeżeli antonim to przymiotnik męski l.poj. — wszystkie 4 są przymiotnikami męskimi l.poj.
  · Jeżeli czasownik w bezokoliczniku — wszystkie 4 są czasownikami w bezokoliczniku.
  · Jeżeli rzeczownik w mianowniku — wszystkie 4 są rzeczownikami w mianowniku.
- Opcje powinny być podobnej długości i stylu — poprawna odpowiedź NIE może wyróżniać się wizualnie.
- Pytanie pokazuje TYLKO definicję pytanego słowa (nie samo słowo). Zapisz słowo w polu question_word, a definicję w question_definition.
- Każde pytanie MUSI dotyczyć INNEGO słowa.

Odpowiedz WYŁĄCZNIE w formacie JSON (bez markdown):
{
  "questions": [
    {
      "question_word": "słowo z FOCUS",
      "question_definition": "definicja tego słowa",
      "options": ["antonim", "dystraktor1", "dystraktor2", "dystraktor3"],
      "correct": 0,
      "explanation": "krótkie wyjaśnienie dlaczego to przeciwieństwo"
    }
  ]
}

correct = indeks (0-3) antonimu w options. Wymieszaj kolejność opcji — antonim NIE zawsze na pozycji 0.
Zwróć od 4 do 8 pytań — preferuj 8 jeśli da się znaleźć tyle solidnych antonimów w POOL.`;

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
          { role: "user", content: `FOCUS:\n${focusList}\n\nPOOL (dozwolone słowa):\n${poolList}\n\nWygeneruj pytania o antonimy.` },
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

    // Validate: all 4 options MUST exist in pool (case-insensitive match), correct index sane, dedupe
    const norm = (s: string) => s.trim().toLowerCase();
    const poolSet = new Set(candidatePool.map((p) => norm(p.word)));
    const seen = new Set<string>();
    const cleaned = result.questions.filter((q) => {
      if (!q || !Array.isArray(q.options) || q.options.length !== 4) return false;
      if (typeof q.correct !== "number" || q.correct < 0 || q.correct > 3) return false;
      const optKeys = q.options.map(norm);
      if (new Set(optKeys).size !== 4) return false;
      if (!optKeys.every((o) => poolSet.has(o))) return false;
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
