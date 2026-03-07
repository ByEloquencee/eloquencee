import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const typeLabels: Record<string, string> = {
      grammar: "gramatyka (odmiany, czasy, przypadki, przyimki)",
      punctuation: "interpunkcja (przecinki, kropki, myślniki, dwukropki)",
      spelling: "ortografia (ó/u, rz/ż, ch/h, wielkie/małe litery)",
    };

    const difficultyLabels: Record<string, string> = {
      beginner: "początkujący - proste zdania, podstawowe reguły",
      intermediate: "średnio zaawansowany - złożone zdania, trudniejsze reguły",
      advanced: "zaawansowany - literackie zdania, wyjątki od reguł, pułapki",
    };

    const systemPrompt = `Jesteś nauczycielem języka polskiego. Wygeneruj JEDNO ćwiczenie z zakresu: ${typeLabels[type] || type}.
Poziom: ${difficultyLabels[difficulty] || difficulty}.

Odpowiedz WYŁĄCZNIE w formacie JSON (bez markdown):
{
  "question": "treść pytania/polecenia",
  "options": ["A", "B", "C", "D"],
  "correct": 0,
  "explanation": "krótkie wyjaśnienie poprawnej odpowiedzi i reguły"
}

correct to indeks (0-3) poprawnej odpowiedzi w tablicy options.
Pytanie powinno być konkretne, jednoznaczne i edukacyjne. Zawsze podawaj 4 opcje.`;

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
          { role: "user", content: `Wygeneruj ćwiczenie z ${typeLabels[type] || type}.` },
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
    
    // Parse JSON from response, handling possible markdown wrapping
    let exercise;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      exercise = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      exercise = null;
    }

    if (!exercise) {
      return new Response(JSON.stringify({ error: "Nie udało się wygenerować ćwiczenia." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ exercise }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-exercise error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
