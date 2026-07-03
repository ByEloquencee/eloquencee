# Plan: Wskaźnik postępu importu JSON (krok 3 ChatGPTPromptDialog)

## Co budujemy
W kroku 3 dialogu "Prompt do ChatGPT" (wklejanie JSON-a z odpowiedzią ChatGPT) dodajemy wizualny wskaźnik postępu pokazujący przebieg walidacji i zapisu słów do kolejki moderacji.

## Dlaczego
Obecnie `handleInsert` wykonuje walidację w pętli i jeden zbiorczy `insert()`. Użytkownik nie widzi postępu — przycisk jest zablokowany, a jedyną informacją jest toast "Przetwarzam...". Przy większej liczbie słów (20-50) brak feedbacku jest frustrujący.

## Zmiany w logice zapisu
1. **Faza walidacji**: iteracja po sparsowanym JSON, budowanie tablicy `rows` — pokazujemy licznik "Sprawdzam X/Y".
2. **Faza zapisu (chunked)**: dzielimy `rows` na paczki po 5 słów i zapisujemy sekwencyjnie (sekwencja `await insert(chunk)`).
3. **Stan progresu**: nowy stan `importProgress: { done: number; total: number; phase: 'walidacja' | 'zapis' } | null`.
4. **Aktualizacja UI**: po każdym zapisanym chunku zwiększamy `done` i re-renderujemy pasek.

## UI / Komponenty
- **Pasek postępu**: pod textarea w kroku 3, tylko gdy `importProgress` jest aktywny. Wąska belka z wypełnieniem `%`, kolor `bg-primary`.
- **Etykieta**: tekst obok paskiem, np. "Walidacja 12/20..." → "Zapis 10/20..."
- **Przycisk**: zamiast "Zapisz do kolejki" pokazuje `Loader2` + tekst fazy podczas importu.
- **Podsumowanie**: po zakończeniu toast z wynikiem (jak obecnie: dodano/duplikaty/błędne).

## Szczegóły techniczne
- Chunk size: 5 słów na zapytanie (balans między szybkością a granularnością progresu).
- Walidacja pozostaje synchroniczna, ale stan jest aktualizowany co 5 iteracji (aby uniknąć zbyt częstych re-renderów).
- Błąd w dowolnym chunku: przerywamy, toast z komunikatem, częściowo zapisane dane pozostają w bazie (brak transakcji — to już obecne ograniczenie, nie zmieniamy tego).
- `submitting` zastępuje interakcję — textarea i przycisk disabled podczas importu.

## Pliki do zmiany
- `src/components/ChatGPTPromptDialog.tsx` — refaktoryzacja `handleInsert`, nowy stan, nowy JSX paska postępu w sekcji `step === 3`.

## Nie w zakresie
- Nie zmieniamy kroków 1-2 dialogu.
- Nie zmieniamy struktury bazy, API ani innych paneli.
- Nie dodajemy anulowania importu w trakcie.