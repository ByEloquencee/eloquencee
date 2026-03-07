import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, difficulty, hint } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Jesteś ekspertem języka polskiego. Wygeneruj jedno rzadkie, ciekawe polskie słowo do aplikacji edukacyjnej "Eloquencee".

Wymagania:
- Kategoria: ${category || "dowolna"}
- Poziom trudności: ${difficulty || "advanced"}
${hint ? `- Podpowiedź/temat: ${hint}` : ""}
- Słowo powinno być rzadkie, ciekawe i wartościowe do nauki
- Definicja powinna być zwięzła ale treściwa
- Przykład użycia w naturalnym zdaniu
- Etymologia jeśli ciekawa`;

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
          { role: "user", content: "Wygeneruj słowo." },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "add_word",
              description: "Dodaje nowe słowo do bazy",
              parameters: {
                type: "object",
                properties: {
                  word: { type: "string", description: "Słowo po polsku" },
                  part_of_speech: { type: "string", description: "Część mowy (np. rzeczownik, czasownik, przymiotnik)" },
                  definition: { type: "string", description: "Definicja słowa" },
                  example: { type: "string", description: "Przykład użycia w zdaniu" },
                  etymology: { type: "string", description: "Etymologia słowa (opcjonalnie)" },
                },
                required: ["word", "part_of_speech", "definition", "example"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "add_word" } },
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
      return new Response(JSON.stringify({ error: "AI nie wygenerowało słowa" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wordData = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(wordData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-word error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
