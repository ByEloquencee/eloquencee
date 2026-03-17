import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { words } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!words || words.length < 8) {
      return new Response(JSON.stringify({ error: "Potrzeba minimum 8 słów." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send up to 30 words to keep prompt manageable
    const wordPool = words.slice(0, 30);
    const wordList = wordPool.map((w: { word: string; definition: string }, i: number) =>
      `${i}. ${w.word} — ${w.definition}`
    ).join("\n");

    const systemPrompt = `Jesteś ekspertem od języka polskiego. Otrzymasz listę słów z definicjami. Twoim zadaniem jest stworzyć 8 pytań quizowych o SYNONIMY.

Dla każdego pytania:
1. Wybierz słowo z listy jako "pytanie" (question_word)
2. Znajdź lub wymyśl synonim tego słowa (synonym) — synonim NIE musi być z listy
3. Wybierz 3 inne słowa z listy jako błędne odpowiedzi (distractors)
4. Synonim powinien być prawdziwym, poprawnym synonimem lub słowem bardzo bliskim znaczeniowo

Odpowiedz WYŁĄCZNIE w formacie JSON (bez markdown):
{
  "questions": [
    {
      "question_word": "słowo z listy",
      "question_definition": "definicja tego słowa",
      "options": ["synonim", "dysttraktor1", "dysttraktor2", "dysttraktor3"],
      "correct": 0,
      "explanation": "krótkie wyjaśnienie dlaczego to synonim"
    }
  ]
}

correct to indeks (0-3) poprawnej odpowiedzi (synonimu) w tablicy options. Opcje powinny być WYMIESZANE - synonim nie zawsze na pozycji 0.
Używaj RÓŻNYCH słów jako pytania - nie powtarzaj tego samego słowa.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Oto lista słów:\n${wordList}\n\nWygeneruj 8 pytań quizowych o synonimy.` },
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

    let result;
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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-synonym-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
