import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const words = [
  { word: "Aprioryczny", partOfSpeech: "przymiotnik", definition: "Oparty na rozumowaniu, a nie na doświadczeniu; z góry założony.", example: "Jego aprioryczne przekonania nie miały oparcia w faktach.", etymology: "z łac. a priori — z tego, co wcześniejsze" },
  { word: "Demiurg", partOfSpeech: "rzeczownik", definition: "Twórca, stwórca; w filozofii — boski budowniczy świata.", example: "Pisarz stał się demiurgiem własnego literackiego uniwersum." },
  { word: "Egzegeza", partOfSpeech: "rzeczownik", definition: "Naukowy komentarz i interpretacja tekstu, zwłaszcza biblijnego.", example: "Egzegeza tego fragmentu zajęła uczonym lata." },
  { word: "Immanentny", partOfSpeech: "przymiotnik", definition: "Tkwiący wewnętrznie w czymś, nieodłączny.", example: "Ciekawość jest immanentną cechą ludzkiej natury." },
  { word: "Solipsyzm", partOfSpeech: "rzeczownik", definition: "Pogląd filozoficzny, że istnieje tylko własne ja i jego przeżycia.", example: "Solipsyzm jest skrajną formą subiektywizmu." },
  { word: "Hubris", partOfSpeech: "rzeczownik", definition: "Pycha, zuchwałość; nadmierna pewność siebie prowadząca do upadku.", example: "Hubris dyrektora doprowadził firmę do bankructwa." },
  { word: "Kontemplacja", partOfSpeech: "rzeczownik", definition: "Głębokie, skupione rozmyślanie; duchowe skupienie.", example: "Pogrążył się w kontemplacji zachodu słońca." },
  { word: "Transgresja", partOfSpeech: "rzeczownik", definition: "Przekroczenie granic, norm, konwencji.", example: "Sztuka awangardowa często opiera się na transgresji." },
  { word: "Palimpsest", partOfSpeech: "rzeczownik", definition: "Rękopis, z którego zmyto pierwotny tekst i napisano nowy.", example: "Naukowcy odkryli pod tekstem palimpsestu starożytny traktat." },
  { word: "Hermetyczny", partOfSpeech: "przymiotnik", definition: "Szczelnie zamknięty; trudny do zrozumienia dla postronnych.", example: "Jego wiersze są hermetyczne i wymagają głębokiej analizy." },
  { word: "Efemeryczny", partOfSpeech: "przymiotnik", definition: "Krótkotrwały, przemijający, nietrwały.", example: "Sława w mediach społecznościowych jest efemeryczna." },
  { word: "Atawizm", partOfSpeech: "rzeczownik", definition: "Nawrót do cech przodków; przeżytek z dawnych czasów.", example: "Ta tradycja to swoisty atawizm kulturowy." },
  { word: "Dyletant", partOfSpeech: "rzeczownik", definition: "Osoba zajmująca się czymś powierzchownie, bez głębszej wiedzy.", example: "Nie chcę, żeby jakiś dyletant naprawiał mi samochód." },
  { word: "Makiawelizm", partOfSpeech: "rzeczownik", definition: "Bezwzględność w dążeniu do celu; polityka pozbawiona skrupułów.", example: "Makiawelizm szefa firmy przerażał pracowników." },
  { word: "Nepotyzm", partOfSpeech: "rzeczownik", definition: "Faworyzowanie krewnych i znajomych przy obsadzaniu stanowisk.", example: "Nepotyzm w tej instytucji był powszechnie znany." },
  { word: "Prokrastynacja", partOfSpeech: "rzeczownik", definition: "Nawykowe odkładanie działań na później.", example: "Prokrastynacja to plaga współczesnych studentów." },
  { word: "Kognitywny", partOfSpeech: "przymiotnik", definition: "Dotyczący poznania, procesów myślowych i umysłowych.", example: "Terapia kognitywna pomaga zmienić negatywne wzorce myślenia." },
  { word: "Katharsis", partOfSpeech: "rzeczownik", definition: "Oczyszczenie emocjonalne przez przeżycie silnych uczuć.", example: "Oglądanie tragedii greckiej miało prowadzić do katharsis." },
  { word: "Empatia", partOfSpeech: "rzeczownik", definition: "Zdolność wczuwania się w stany emocjonalne innych osób.", example: "Empatia jest kluczowa w pracy terapeuty." },
  { word: "Dysonans poznawczy", partOfSpeech: "rzeczownik", definition: "Napięcie wynikające z posiadania sprzecznych przekonań lub postaw.", example: "Palacz świadomy szkodliwości tytoniu doświadcza dysonansu poznawczego." },
  { word: "Resiliencja", partOfSpeech: "rzeczownik", definition: "Odporność psychiczna; zdolność do radzenia sobie z trudnościami.", example: "Resiliencja dzieci z trudnych środowisk zaskakiwała badaczy." },
  { word: "Pareidolia", partOfSpeech: "rzeczownik", definition: "Postrzeganie znanych wzorców (np. twarzy) w losowych obiektach.", example: "Pareidolia tłumaczy, dlaczego widzimy twarz na powierzchni Marsa." },
  { word: "Deprecjacja", partOfSpeech: "rzeczownik", definition: "Spadek wartości; umniejszanie, pomniejszanie znaczenia.", example: "Deprecjacja waluty uderzyła w oszczędności obywateli." },
  { word: "Ostentacyjny", partOfSpeech: "przymiotnik", definition: "Robiony na pokaz, demonstracyjny, manifestacyjny.", example: "Ostentacyjnie odwrócił się plecami do mówcy." },
  { word: "Redundancja", partOfSpeech: "rzeczownik", definition: "Nadmiar, zbędne powtórzenia; nadmiarowość informacji.", example: "Redundancja w jego tekście utrudniała lekturę." },
  { word: "Truizm", partOfSpeech: "rzeczownik", definition: "Banalne, oczywiste stwierdzenie; komunał.", example: "Mówienie, że czas to pieniądz, to truizm." },
  { word: "Lakoniczny", partOfSpeech: "przymiotnik", definition: "Zwięzły, treściwy, wyrażony w niewielu słowach.", example: "Jego lakoniczna odpowiedź nie pozostawiała wątpliwości." },
  { word: "Liminalny", partOfSpeech: "przymiotnik", definition: "Dotyczący progu, graniczny; przejściowy.", example: "Adolescencja to okres liminalny między dzieciństwem a dorosłością." },
  { word: "Ubikwitarny", partOfSpeech: "przymiotnik", definition: "Wszechobecny, spotykany wszędzie.", example: "Smartfony stały się ubikwitarne w codziennym życiu." },
  { word: "Sublimacja", partOfSpeech: "rzeczownik", definition: "Przekształcanie nieakceptowanych popędów w działania społecznie aprobowane.", example: "Jego agresję sublimował poprzez intensywne treningi bokserskie." },
];

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function buildEmailHtml(w: typeof words[0]) {
  return `
<!DOCTYPE html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#18181b;padding:28px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Eloquencee</h1>
      <p style="margin:6px 0 0;color:#a1a1aa;font-size:13px;">Twoje codzienne słowo</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 4px;font-size:26px;color:#18181b;font-weight:700;">${w.word}</h2>
      <p style="margin:0 0 20px;font-size:13px;color:#71717a;font-style:italic;">${w.partOfSpeech}</p>
      <p style="margin:0 0 20px;font-size:15px;color:#27272a;line-height:1.6;">${w.definition}</p>
      <div style="background:#f4f4f5;border-left:3px solid #18181b;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#3f3f46;font-style:italic;">„${w.example}"</p>
      </div>
      ${w.etymology ? `<p style="margin:0;font-size:12px;color:#a1a1aa;">📖 ${w.etymology}</p>` : ""}
    </div>
    <div style="padding:16px 32px 24px;text-align:center;">
      <a href="https://eloquencee.lovable.app" style="display:inline-block;padding:10px 28px;background:#18181b;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">Otwórz Eloquencee</a>
    </div>
    <div style="padding:12px 32px 20px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#a1a1aa;">Otrzymujesz ten e-mail, bo włączono opcję „Codzienne słowo na e-mail" w ustawieniach konta.</p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users who opted in
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name")
      .eq("daily_email_enabled", true);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "Brak subskrybentów" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get emails from auth.users
    const userIds = profiles.map((p) => p.user_id);
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const emailMap = new Map<string, string>();
    for (const u of usersData.users) {
      if (u.email && userIds.includes(u.id)) {
        emailMap.set(u.id, u.email);
      }
    }

    const word = getRandomWord();
    const html = buildEmailHtml(word);

    let sent = 0;
    let errors = 0;

    for (const profile of profiles) {
      const email = emailMap.get(profile.user_id);
      if (!email) continue;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Eloquencee <onboarding@resend.dev>",
          to: [email],
          subject: `Słowo dnia: ${word.word}`,
          html,
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        errors++;
        const errBody = await res.text();
        console.error(`Failed to send to ${email}: ${errBody}`);
      }
    }

    return new Response(
      JSON.stringify({ sent, errors, word: word.word }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
