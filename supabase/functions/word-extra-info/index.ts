import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { word, definition, etymology, category, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Jesteś ekspertem od języka polskiego. Podaj dodatkowe informacje o słowie "${word}".
Definicja: "${definition}"
${etymology ? `Etymologia: "${etymology}"` : ""}
Kategoria: ${category}
Poziom użytkownika: ${difficulty}

Podaj zwięźle (max 200 słów):
1. Dodatkowe znaczenia słowa (jeśli istnieją)
2. Synonimy i antonimy
3. Ciekawostki językowe lub historyczne
4. Kolokacje (typowe połączenia wyrazowe)

Dostosuj złożoność odpowiedzi do poziomu użytkownika. Formatuj czytelnie, używaj emoji jako ozdobników sekcji. Nie powtarzaj definicji ani etymologii.`;

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
          { role: "user", content: `Podaj dodatkowe informacje o słowie "${word}".` },
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
    const info = data.choices?.[0]?.message?.content || "Brak danych.";

    return new Response(JSON.stringify({ info }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("word-extra-info error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
