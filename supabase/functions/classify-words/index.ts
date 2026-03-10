import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { words } = await req.json();
    // words: Array<{ word: string; definition: string; example?: string }>

    if (!Array.isArray(words) || words.length === 0) {
      return new Response(JSON.stringify({ error: "Brak słów do klasyfikacji" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const wordsList = words.map((w: any, i: number) =>
      `${i + 1}. "${w.word}" — ${w.definition}${w.example ? ` (np. ${w.example})` : ""}`
    ).join("\n");

    const categories = ["filozofia", "literatura", "ogólne", "psychologia", "ciekawi_ludzie", "biznes_finanse", "religia", "historia", "sztuka"];
    const partsOfSpeech = ["rzeczownik", "przymiotnik", "czasownik", "przysłówek", "wyrażenie"];
    const difficulties = ["beginner", "intermediate", "advanced"];

    const systemPrompt = `Jesteś ekspertem języka polskiego. Dla każdego podanego słowa określ:
1. part_of_speech — część mowy. Dozwolone: ${partsOfSpeech.join(", ")}
2. category — kategoria tematyczna. Dozwolone: ${categories.join(", ")}
3. difficulty — poziom trudności. Dozwolone: ${difficulties.join(", ")}

Zasady:
- Kategoria powinna najlepiej pasować do kontekstu słowa
- Poziom trudności: beginner = powszechne ale warte nauki, intermediate = rzadsze ale spotykane, advanced = rzadkie i wyrafinowane
- Część mowy powinna być dokładna

Słowa do klasyfikacji:
${wordsList}`;

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
          { role: "user", content: "Sklasyfikuj powyższe słowa." },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_words",
              description: "Zwraca klasyfikację dla listy słów",
              parameters: {
                type: "object",
                properties: {
                  classifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number", description: "Indeks słowa (0-based)" },
                        part_of_speech: { type: "string", enum: partsOfSpeech },
                        category: { type: "string", enum: categories },
                        difficulty: { type: "string", enum: difficulties },
                      },
                      required: ["index", "part_of_speech", "category", "difficulty"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["classifications"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_words" } },
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
      return new Response(JSON.stringify({ error: "AI nie zwróciło klasyfikacji" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-words error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
