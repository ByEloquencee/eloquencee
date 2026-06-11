## Cel
Zastąpić obecny generator partii (Gemini przez Lovable AI) przepływem opartym na ChatGPT Plus: admin kopiuje gotowy prompt, generuje słowa w ChatGPT, wkleja JSON z powrotem do aplikacji. Trafia do tej samej kolejki moderacji `pending_words`.

## Zmiany w UI (`AdminPanel.tsx` + nowy dialog)

1. **Usuwamy** stary przycisk „Generuj partię" oraz komponent `GenerateBatchDialog.tsx`.
2. **Nowy przycisk** „Prompt do ChatGPT" (ikona Sparkles) w panelu „Kolejka".
3. **Nowy dialog** `ChatGPTPromptDialog.tsx` z trzema krokami w jednym widoku:
   - **Krok 1 – konfiguracja:** temat, liczba słów (1–50), kategoria, trudność, tagi stylistyczne (te same pola co dziś).
   - **Krok 2 – prompt:** wygenerowany tekst w `<textarea readonly>` + przycisk „Kopiuj" (clipboard) + link „Otwórz ChatGPT" (`https://chat.openai.com/`).
   - **Krok 3 – wklej JSON:** `<textarea>` na odpowiedź z ChatGPT + przycisk „Dodaj do kolejki".

## Treść promptu (budowana po stronie klienta)

Prompt zawiera:
- rolę: leksykograf języka polskiego, wyłącznie polskie słowa zgodne z SJP/PWN
- temat, kategorię, trudność, sugerowane tagi, liczbę słów
- **listę słów do pominięcia: WSZYSTKIE istniejące słowa w wybranej kategorii** (z `global_words` + `pending_words` o statusie `pending`/`approved`) – pobierane raz przy otwarciu kroku 2 jednym zapytaniem `select word where category = ?`. Bez limitu 50 jak dziś.
- wymóg formatu: **wyłącznie JSON array** (bez markdown, bez komentarzy) ze schematem: `word, part_of_speech, definition, simplified_definition, example_sentence, etymology, stylistic_tags[], ai_confidence_score`
- zasady: forma podstawowa, wielka litera, definicja 1–2 zdania, etymologia krótka lub `""`.

## Parsowanie i zapis

Nowa funkcja klienta `parseAndInsertChatGPTBatch`:
- `JSON.parse` z fallbackiem na wyciągnięcie pierwszego `[...]` z tekstu (gdy ChatGPT doda otoczkę)
- walidacja każdego rekordu (wymagane pola, typy)
- deduplikacja po `norm(word)` względem `global_words` + `pending_words`
- insert do `pending_words` z `dictionary_source: "ai:chatgpt-manual"`, wspólnym `batch_id` (UUID po stronie klienta), `batch_prompt = temat`, `created_by_ai: true`, `verification_status: "pending"`
- toast: „Dodano X/Y (pominięto Z duplikatów / W błędnych)"

Insert idzie bezpośrednio przez `supabase.from("pending_words").insert(...)` – istniejąca polityka RLS dla moderatorów już to dopuszcza, więc nie potrzeba edge function.

## Backend
- **Usuwamy** edge function `generate-pending-batch` (`supabase/functions/generate-pending-batch/`) i jej wywołania.
- `regenerate-pending-word` zostaje bez zmian (dotyczy pojedynczego rekordu po zatwierdzeniu w kolejce – to coś innego niż „prompt dla pojedynczego słowa", o którym pytałeś; nic nowego tu nie dodaję).
- Reszta (`approve_pending_word`, RLS, tabela) bez zmian.

## Dlaczego nie ma „promptu dla pojedynczego słowa"
Wcześniej zasugerowałem to jako opcję „rozszerz słowo X" – w praktyce nie ma sensu skoro:
- nowe słowa lecą partiami z ChatGPT,
- istniejące pozycje masz już pod przyciskiem „Regeneruj" w wierszu kolejki (`regenerate-pending-word`).
Pomijam więc całkowicie ten wariant.

## Pliki
- usuń: `src/components/GenerateBatchDialog.tsx`, `supabase/functions/generate-pending-batch/index.ts`
- nowy: `src/components/ChatGPTPromptDialog.tsx`
- edytuj: `src/components/AdminPanel.tsx` (zamiana przycisku i importu), `src/components/PendingWordsPanel.tsx` jeśli trzyma przycisk generowania
