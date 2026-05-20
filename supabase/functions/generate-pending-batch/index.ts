import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireModerator } from "../_shared/moderator-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

interface AIWord {
  word: string;
  part_of_speech: string;
  definition: string;
  simplified_definition: string;
  example_sentence: string;
  etymology: string;
  stylistic_tags: string[];
  ai_confidence_score: number;
}

async function generateOne(
  apiKey: string,
  prompt: string,
  category: string,
  difficulty: string,
  tags: string[],
  avoid: string[],
): Promise<AIWord | null> {
  const sys = `Jesteś leksykografem języka polskiego. Generujesz JEDNO unikalne polskie słowo dopasowane do tematu: "${prompt}".

WYMAGANIA:
- Słowo MUSI istnieć w języku polskim (norma SJP/PWN), poprawna pisownia.
- Forma podstawowa (rzeczownik: mianownik l.poj.; czasownik: bezokolicznik; przymiotnik: m. l.poj.).
- Słowo i definicja zaczynają się wielką literą.
- Definicja: pełna, precyzyjna (1-2 zdania).
- Uproszczona definicja: prostym językiem, dla początkujących (1 zdanie).
- Przykład: naturalne polskie zdanie z użyciem słowa.
- Etymologia: krótka i prawdziwa, lub pusty string.
- Tagi stylistyczne: 1-5 tagów po polsku (np. "poetyckie","archaiczne","ironiczne","wulgarne","podniosłe"). Sugerowane: ${tags.join(", ") || "(dowolne pasujące)"}.
- ai_confidence_score: 0.0-1.0 — twoja pewność co do poprawności hasła.

Kategoria: ${category}
Trudność: ${difficulty}
${avoid.length ? `UNIKAJ tych słów (już użyte): ${avoid.slice(-50).join(", ")}` : ""}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Wygeneruj jedno polskie słowo pasujące do: "${prompt}".` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "add_pending_word",
            parameters: {
              type: "object",
              properties: {
                word: { type: "string" },
                part_of_speech: { type: "string" },
                definition: { type: "string" },
                simplified_definition: { type: "string" },
                example_sentence: { type: "string" },
                etymology: { type: "string" },
                stylistic_tags: { type: "array", items: { type: "string" } },
                ai_confidence_score: { type: "number" },
              },
              required: [
                "word",
                "part_of_speech",
                "definition",
                "simplified_definition",
                "example_sentence",
                "etymology",
                "stylistic_tags",
                "ai_confidence_score",
              ],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "add_pending_word" } },
    }),
  });

  if (!resp.ok) {
    console.error("AI gateway error", resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return null;
  try {
    return JSON.parse(call.function.arguments) as AIWord;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const guard = await requireModerator(req, corsHeaders);
  if (!guard.ok) return guard.response!;

  try {
    const body = await req.json();
    const prompt = String(body.prompt || "").trim();
    const count = Math.max(1, Math.min(25, Number(body.count) || 10));
    const category = String(body.category || "ogólne");
    const difficulty = String(body.difficulty || "advanced");
    const tags: string[] = Array.isArray(body.tags) ? body.tags.map(String) : [];

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Brak promptu." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const admin = guard.admin!;

    const { data: existingGlobal } = await admin.from("global_words").select("word").limit(2000);
    const { data: existingPending } = await admin
      .from("pending_words")
      .select("word")
      .eq("verification_status", "pending")
      .limit(2000);
    const existing = new Set<string>([
      ...((existingGlobal as any[]) || []).map((r: any) => norm(r.word)),
      ...((existingPending as any[]) || []).map((r: any) => norm(r.word)),
    ]);

    const batchId = crypto.randomUUID();
    const inserted: AIWord[] = [];
    const skipped: string[] = [];

    for (let i = 0; i < count; i++) {
      const word = await generateOne(apiKey, prompt, category, difficulty, tags, [
        ...existing,
        ...inserted.map((w) => norm(w.word)),
      ]);
      if (!word || !word.word || !word.definition) {
        skipped.push("brak danych");
        continue;
      }
      if (existing.has(norm(word.word))) {
        skipped.push(word.word);
        continue;
      }

      const row = {
        word: cap(word.word.trim()),
        part_of_speech: (word.part_of_speech || "").trim(),
        definition: cap((word.definition || "").trim()),
        simplified_definition: cap((word.simplified_definition || "").trim()),
        example_sentence: (word.example_sentence || "").trim(),
        etymology: (word.etymology || "").trim() || null,
        dictionary_source: "ai:gemini-2.5-pro",
        source_url: null,
        stylistic_tags: Array.isArray(word.stylistic_tags)
          ? word.stylistic_tags.map(String).filter(Boolean)
          : [],
        difficulty_level: difficulty,
        category,
        ai_confidence_score:
          typeof word.ai_confidence_score === "number" ? word.ai_confidence_score : null,
        created_by_ai: true,
        verification_status: "pending",
        batch_id: batchId,
        batch_prompt: prompt,
        created_by: guard.userId!,
      };

      const { error } = await admin.from("pending_words").insert(row as any);
      if (error) {
        console.error("insert pending error", error);
        skipped.push(word.word + " (db)");
        continue;
      }
      existing.add(norm(word.word));
      inserted.push(word);
    }

    return new Response(
      JSON.stringify({ batch_id: batchId, inserted: inserted.length, skipped: skipped.length, total: count }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-pending-batch error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
