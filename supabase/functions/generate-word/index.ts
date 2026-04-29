import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, difficulty, hint } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Pobierz istniejące słowa, by uniknąć duplikatów
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: existing } = await supabase.from("global_words").select("word").limit(1500);
    const existingSet = new Set((existing || []).map((r: any) => norm(r.word)));

    const callAI = async (extraInstruction = "") => {
      const systemPrompt = `Jesteś językoznawcą-leksykografem języka polskiego z doświadczeniem w opracowywaniu haseł słownikowych (PWN, WSJP). Tworzysz JEDNO hasło do aplikacji "Eloquencee".

ABSOLUTNE WYMAGANIA POPRAWNOŚCI:
1. Słowo MUSI istnieć w języku polskim — nie wymyślaj, nie kalkuj z angielskiego, nie twórz neologizmów.
2. Forma podstawowa: rzeczownik = mianownik liczby pojedynczej; czasownik = bezokolicznik; przymiotnik = mianownik l.poj. rodzaju męskiego.
3. Pisownia ZGODNA z normą ortograficzną SJP/PWN (poprawne ą/ę/ó/ż/ź/rz/h/ch). Sprawdź dokładnie literę po literze.
4. Definicja merytorycznie POPRAWNA, zwięzła (1–2 zdania), bez błędów rzeczowych. Nie myl podobnie brzmiących słów.
5. Część mowy musi być rzeczywiście tą częścią mowy.
6. Przykład: NATURALNE polskie zdanie używające słowa w odpowiedniej formie gramatycznej.
7. Etymologia: prawdziwa (greka, łacina, francuski, niemiecki itp.) — krótko, lub pusty string jeśli nie jesteś pewny. NIE zmyślaj.
8. Słowo i definicja zaczynają się WIELKĄ literą.
9. Słowo powinno być rzadkie/wartościowe edukacyjnie, ale 100% prawdziwe.

Parametry:
- Kategoria: ${category || "dowolna"}
- Poziom trudności: ${difficulty || "advanced"}
${hint ? `- Wskazówka tematyczna: ${hint}` : ""}

PRZED ZWRÓCENIEM: zweryfikuj w myślach pisownię, definicję i przykład. Jeśli masz JAKIEKOLWIEK wątpliwości co do poprawności słowa lub definicji — wybierz INNE, pewne słowo.

${extraInstruction}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Wygeneruj jedno bardzo dobrze zweryfikowane hasło słownikowe." },
          ],
          tools: [{
            type: "function",
            function: {
              name: "add_word",
              description: "Dodaje zweryfikowane hasło słownikowe",
              parameters: {
                type: "object",
                properties: {
                  word: { type: "string", description: "Słowo w formie podstawowej, wielką literą, poprawna polska ortografia" },
                  part_of_speech: { type: "string", description: "Część mowy po polsku (rzeczownik, czasownik, przymiotnik, przysłówek itd.)" },
                  definition: { type: "string", description: "Poprawna merytorycznie definicja, 1-2 zdania, wielką literą" },
                  example: { type: "string", description: "Naturalne zdanie po polsku z użyciem słowa" },
                  etymology: { type: "string", description: "Krótka prawdziwa etymologia lub pusty string" },
                  confidence: { type: "string", enum: ["high", "medium", "low"], description: "Twoja pewność co do poprawności pisowni i definicji" },
                },
                required: ["word", "part_of_speech", "definition", "example", "etymology", "confidence"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "add_word" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("Zbyt wiele zapytań, spróbuj za chwilę.");
        if (response.status === 402) throw new Error("Wyczerpano limit zapytań AI.");
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        throw new Error("Błąd AI");
      }
      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("AI nie wygenerowało słowa");
      return JSON.parse(toolCall.function.arguments);
    };

    // Krok 1: generacja
    let attempts = 0;
    let wordData: any = null;
    let lastError = "";
    while (attempts < 3) {
      attempts++;
      const extra = attempts > 1
        ? `UWAGA: Poprzednia propozycja została odrzucona (${lastError}). Wybierz INNE, pewniejsze słowo. ${existingSet.size > 0 ? `Unikaj słów już w bazie.` : ""}`
        : "";
      const candidate = await callAI(extra);

      if (!candidate.word || !candidate.definition) { lastError = "brak słowa/definicji"; continue; }
      if (candidate.confidence === "low") { lastError = "niska pewność AI"; continue; }
      if (existingSet.has(norm(candidate.word))) { lastError = "duplikat w bazie"; continue; }

      // Krok 2: walidacja drugim wywołaniem AI (krytyk)
      const reviewResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: `Jesteś surowym recenzentem słownikowym języka polskiego. Sprawdzasz hasło pod kątem: (1) czy słowo istnieje w polszczyźnie i ma poprawną pisownię SJP/PWN, (2) czy definicja jest merytorycznie poprawna, (3) czy część mowy się zgadza, (4) czy przykład jest poprawny gramatycznie i sensowny, (5) czy etymologia (jeśli podana) jest prawdziwa. Bądź bezlitosny — jeśli cokolwiek budzi wątpliwości, odrzuć.` },
            { role: "user", content: `Oceń hasło:\nSłowo: ${candidate.word}\nCzęść mowy: ${candidate.part_of_speech}\nDefinicja: ${candidate.definition}\nPrzykład: ${candidate.example}\nEtymologia: ${candidate.etymology || "(brak)"}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "review",
              parameters: {
                type: "object",
                properties: {
                  approved: { type: "boolean" },
                  issue: { type: "string", description: "Krótki opis problemu lub pusty string" },
                  corrected_definition: { type: "string", description: "Jeśli definicja wymaga drobnej korekty, podaj poprawioną wersję; w innym wypadku pusty string" },
                  corrected_example: { type: "string", description: "Poprawiony przykład lub pusty string" },
                },
                required: ["approved", "issue", "corrected_definition", "corrected_example"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "review" } },
        }),
      });

      if (reviewResp.ok) {
        const reviewData = await reviewResp.json();
        const reviewCall = reviewData.choices?.[0]?.message?.tool_calls?.[0];
        if (reviewCall) {
          const review = JSON.parse(reviewCall.function.arguments);
          if (!review.approved) { lastError = `recenzent: ${review.issue}`; continue; }
          if (review.corrected_definition) candidate.definition = review.corrected_definition;
          if (review.corrected_example) candidate.example = review.corrected_example;
        }
      }

      wordData = candidate;
      break;
    }

    if (!wordData) {
      return new Response(JSON.stringify({ error: `Nie udało się wygenerować zweryfikowanego słowa (${lastError})` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalizacja: wielka litera
    wordData.word = cap(wordData.word.trim());
    wordData.definition = cap(wordData.definition.trim());

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
