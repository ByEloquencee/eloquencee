
## Paczki tematyczne — plan implementacji

### 1. Baza danych

**Nowa tabela `pack_word_overrides`** (kuratorska warstwa nad kategoriami):
- `pack_id` (text) — np. `filozofia`, `showbiznes`
- `word_id` (text) — id słowa z `global_words` lub statycznego
- `action` enum `include | exclude`
- moderator może dodać słowo z innej kategorii (`include`) lub ukryć słowo (`exclude`)
- RLS: read public, write moderator

**Nowa tabela `pack_premium_words`** (słowa dla 5 paczek Premium, których nie ma w `global_words`):
- pełne pola jak `global_words` + `pack_id`
- RLS: read public, write moderator

**Nowa tabela `pack_progress`** (postęp użytkownika):
- `user_id`, `pack_id`, `word_id`, `revealed_at`
- unique `(user_id, pack_id, word_id)`
- RLS: tylko właściciel

### 2. Logika paczek (frontend)

Hook `usePackWords(packId)` zwraca słowa paczki:
1. Jeśli `packId` ∈ darmowe kategorie z `global_words` → filtr po `category` + apply `pack_word_overrides`
2. Jeśli `packId` ∈ 5 premium → `pack_premium_words` + overrides
3. `flagi` zostają osobno (już istnieje `FlagsLearningPanel`)

**Darmowe:** wszystkie kategorie z `global_words` (filozofia, literatura, psychologia, biznes, religia, historia, sztuka, medycyna, ogólne).

**Premium:** Show-biznes, Muzyka, Archaizmy, Nauka, Sport — wymagają `is_premium(user)`.

### 3. UI — kafelek paczki

W `WordPacksPanel.tsx`:
- pasek postępu na dole kafelka: `X / Y` + cienka linia pomarańczowa (% opanowanych)
- Premium kafelki: korona w prawym górnym, lekka opacity dla niepremium użytkowników, klik → `PremiumDialog`
- Klik darmowej paczki → nowy ekran `PackDetailView`

### 4. UI — ekran paczki (`PackDetailView`)

Header: nazwa, ikona, `back`, postęp `X/Y opanowane`.

Dwa CTA:
- **Rozpocznij sesję** (10 losowych nieopanowanych słów) → reuse `FlashcardStudyView` z prefiltrowaną talią
- **Przeglądaj wszystkie** → lista słów paczki (klik → otwiera `WordCard` w trybie pojedynczego słowa)

W trakcie sesji/przeglądu — kliknięcie "Pokaż definicję" zapisuje wpis do `pack_progress`. Hook `usePackProgress(packId)` zwraca `mastered: Set<wordId>` i `markRevealed(wordId)`.

### 5. Integracja

- `Index.tsx`: dodać stan `activePackId`, przełączać `PackDetailView` w miejscu głównego widoku
- `WordCard` / `FlashcardStudyView`: opcjonalny prop `onReveal(wordId)` wywoływany przy odsłonięciu definicji — w kontekście paczki podpinamy `markRevealed`
- Premium gate: w `WordPacksPanel` przy klik premium paczki sprawdzamy `useSubscription` — jeśli free → `PremiumDialog`

### 6. Seeding (dane startowe)

Migracja dodaje przykładowe wpisy do `pack_premium_words` (po ~20 słów na paczkę, wygenerowane skryptem AI w panelu admina — na razie pustka i moderator dosypie przez `AdminPanel`). Alternatywnie zostawiamy puste i panel admina otrzymuje filtr paczki w istniejącym importerze AI.

### Szczegóły techniczne

- Nazwy paczek i ikony pozostają w `WordPacksPanel.tsx` (`categoryIcons` + `premiumPacksMeta`)
- `ENABLED_PACKS` znika — dostępność wynika z `is_premium`
- `learning_history` nietknięte (to globalna metryka "dziś"); `pack_progress` to osobny licznik dla paczek
- Reuse `FlashcardStudyView` z prop `cards` ograniczonym do słów paczki
- Quizy/AI/etymologia działają identycznie — paczka to tylko filtr puli słów

### Pytania, na które nie muszę pytać (decyzje domyślne)
- Sesja = 10 słów, priorytet nieopanowane, potem powtórka
- Postęp resetowalny: nie (na razie), w przyszłości "wyczyść postęp"
- Premium block: full-screen `PremiumDialog`, bez podglądu słów paczki
