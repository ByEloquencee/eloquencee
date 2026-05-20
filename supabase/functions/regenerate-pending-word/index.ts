import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireModerator } from "../_shared/moderator-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const guard = await requireModerator(req, corsHeaders);
  if (!guard.ok) return guard.response!;

  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "Brak id." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = guard.admin!;
    const { data: row } = await admin.from("pending_words").select("*").eq("id", id).maybeSingle();
    if (!row) {
      return new Response(JSON.stringify({ error: "Nie znaleziono wpisu." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const sys = `Jesteś leksykografem polskim. Popraw i ulepsz to hasło. Zachowaj słowo "${(row as any).word}", ale popraw definicję, uproszczoną definicję, przykład, etymologię i tagi tak, aby były precyzyjne, naturalne i wartościowe edukacyjnie. Zachowaj wielką literę na początku słowa i definicji. Temat oryginalny: "${(row as any).batch_prompt || "brak"}".`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: sys },
          {
            role: "user",
            content: `Słowo: ${(row as any).word}\nObecna definicja: ${(row as any).definition}\nPopraw je.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rewrite",
              parameters: {
                type: "object",
                properties: {
                  part_of_speech: { type: "string" },
                  definition: { type: "string" },
                  simplified_definition: { type: "string" },
                  example_sentence: { type: "string" },
                  etymology: { type: "string" },
                  stylistic_tags: { type: "array", items: { type: "string" } },
                  ai_confidence_score: { type: "number" },
                },
                required: [
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
        tool_choice: { type: "function", function: { name: "rewrite" } },
      }),
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "Błąd AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "Brak odpowiedzi AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const out = JSON.parse(call.function.arguments);

    const patch = {
      part_of_speech: (out.part_of_speech || "").trim(),
      definition: cap((out.definition || "").trim()),
      simplified_definition: cap((out.simplified_definition || "").trim()),
      example_sentence: (out.example_sentence || "").trim(),
      etymology: (out.etymology || "").trim() || null,
      stylistic_tags: Array.isArray(out.stylistic_tags)
        ? out.stylistic_tags.map(String).filter(Boolean)
        : [],
      ai_confidence_score:
        typeof out.ai_confidence_score === "number" ? out.ai_confidence_score : null,
      verification_status: "pending",
    };

    const { error } = await admin.from("pending_words").update(patch as any).eq("id", id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, patch }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-pending-word error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
