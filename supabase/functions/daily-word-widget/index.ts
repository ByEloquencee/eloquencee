import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mulberry32 - deterministic PRNG seeded by integer
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const rnd = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const indexParam = parseInt(url.searchParams.get("index") || "0", 10);
    const listParam = url.searchParams.get("list") === "1";

    // Fetch global words
    let query = supabase
      .from("global_words")
      .select("word, definition, part_of_speech, example, category, etymology, difficulty");

    // Personalization
    let preferredCategories: string[] = [];
    let difficulty: string | null = null;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_categories, difficulty_level")
        .eq("user_id", userId)
        .maybeSingle();
      if (profile) {
        preferredCategories = profile.preferred_categories || [];
        difficulty = profile.difficulty_level || null;
      }
    }

    const { data: globalWords } = await query;
    let allWords = globalWords || [];

    // Filter by preferences if available
    if (preferredCategories.length > 0) {
      const filtered = allWords.filter((w: any) => preferredCategories.includes(w.category));
      if (filtered.length > 5) allWords = filtered;
    }
    if (difficulty) {
      const filtered = allWords.filter((w: any) => w.difficulty === difficulty);
      if (filtered.length > 5) allWords = filtered;
    }

    if (allWords.length === 0) {
      return new Response(
        JSON.stringify({
          word: "Brak słów",
          definition: "Dodaj słowa do bazy danych",
          partOfSpeech: "",
          example: "",
          category: "ogólne",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Daily seed: same word for same day (per user if logged in)
    const today = new Date().toISOString().slice(0, 10);
    const seedString = today + (userId || "anon");
    const seed = Array.from(seedString).reduce((acc, c) => acc + c.charCodeAt(0), 0);

    // Deterministic shuffle so the order is stable for whole day
    const shuffled = shuffleWithSeed(allWords, seed);

    const mapWord = (w: any) => ({
      word: w.word,
      definition: w.definition,
      partOfSpeech: w.part_of_speech,
      example: w.example,
      category: w.category,
      etymology: w.etymology,
    });

    // Return list of next 20 words (for widget pagination)
    if (listParam) {
      return new Response(
        JSON.stringify({
          date: today,
          words: shuffled.slice(0, 20).map(mapWord),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return single word at given index (0 = word of the day)
    const safeIndex = ((indexParam % shuffled.length) + shuffled.length) % shuffled.length;
    const selected = shuffled[safeIndex];

    return new Response(
      JSON.stringify({
        ...mapWord(selected),
        date: today,
        index: safeIndex,
        total: shuffled.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
