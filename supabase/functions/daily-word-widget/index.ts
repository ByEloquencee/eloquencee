import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use today's date as seed for consistent daily word
    const today = new Date().toISOString().slice(0, 10);
    const seed = Array.from(today).reduce((acc, c) => acc + c.charCodeAt(0), 0);

    // Try global_words first
    const { data: globalWords } = await supabase
      .from("global_words")
      .select("word, definition, part_of_speech, example, category, etymology");

    const allWords = globalWords || [];

    if (allWords.length === 0) {
      return new Response(
        JSON.stringify({ word: "Brak słów", definition: "Dodaj słowa do bazy danych", partOfSpeech: "", example: "", category: "ogólne" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const index = seed % allWords.length;
    const selected = allWords[index];

    return new Response(
      JSON.stringify({
        word: selected.word,
        definition: selected.definition,
        partOfSpeech: selected.part_of_speech,
        example: selected.example,
        category: selected.category,
        etymology: selected.etymology,
        date: today,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
