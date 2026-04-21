import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const rawWord = String(body?.word || "").trim();
    if (!rawWord || rawWord.length > 80) {
      return new Response(JSON.stringify({ error: "Nieprawidłowe słowo." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Jesteś ekspertem języka polskiego. Otrzymasz słowo (lub krótką frazę), które użytkownik wypowiedział głosem do aplikacji Eloquencee.

Twoje zadanie:
1. Sprowadź słowo do formy podstawowej (mianownik liczby pojedynczej dla rzeczowników, bezokolicznik dla czasowników itp.).
2. Wygeneruj pełną kartę słownikową dla tego słowa.
3. Definicja zwięzła ale treściwa (1-3 zdania).
4. Naturalny przykład użycia w jednym zdaniu.
5. Etymologia jeśli jest ciekawa (krótko, max 1 zdanie). Jeśli brak, zostaw pusty string.
6. Kategoria z listy: filozofia, literatura, psychologia, biznes, religia, historia, sztuka, ogólne.
7. Wszystkie teksty po polsku, słowo i definicja zaczynają się wielką literą.

Jeśli słowo nie istnieje w języku polskim lub jest niezrozumiałe, mimo to spróbuj wygenerować najbardziej prawdopodobną interpretację.`;

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
          { role: "user", content: `Słowo wypowiedziane przez użytkownika: "${rawWord}". Wygeneruj kartę słownikową.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_word_card",
              description: "Zwraca kartę słownikową dla podanego słowa",
              parameters: {
                type: "object",
                properties: {
                  word: { type: "string", description: "Słowo w formie podstawowej, wielką literą" },
                  part_of_speech: { type: "string", description: "Część mowy po polsku" },
                  definition: { type: "string", description: "Definicja słowa, zaczyna wielką literą" },
                  example: { type: "string", description: "Przykład użycia w naturalnym zdaniu" },
                  etymology: { type: "string", description: "Etymologia (opcjonalnie, pusty string jeśli brak)" },
                  category: {
                    type: "string",
                    enum: ["filozofia", "literatura", "psychologia", "biznes", "religia", "historia", "sztuka", "ogólne"],
                    description: "Kategoria tematyczna",
                  },
                },
                required: ["word", "part_of_speech", "definition", "example", "etymology", "category"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_word_card" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Zbyt wiele zapytań, spróbuj za chwilę." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Wyczerpano limit zapytań AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Błąd AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI nie wygenerowało karty" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wordData = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(wordData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lookup-word error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
