
# Pending Words — moderation queue for AI vocabulary

Build a dedicated, moderator-only moderation system on top of the existing admin panel. All AI-generated or imported words go through this queue first; nothing is published to `global_words` automatically.

## 1. Database (new table `pending_words`)

New table with every requested field:

- `id` (uuid, pk)
- `word`, `definition`, `simplified_definition`, `example_sentence`, `part_of_speech`
- `dictionary_source` (text, e.g. `"ai:gemini-2.5-pro"`, `"import:csv"`, `"manual"`, future `"sjp_pwn"`, `"wsjp_pan"`)
- `source_url` (text, nullable — for future dictionary-API verification)
- `stylistic_tags` (text[])  — e.g. `{"poetic","archaic","dark-academia"}`
- `difficulty_level` (text)
- `category` (text)
- `ai_confidence_score` (numeric 0–1, nullable)
- `created_by_ai` (boolean)
- `verification_status` (text: `pending` | `approved` | `rejected`)
- `rejection_reason` (text, nullable)
- `batch_id` (uuid, nullable — groups entries from one "Generate Batch" run)
- `batch_prompt` (text, nullable)
- `created_at`, `created_by`
- `approved_at`, `approved_by`
- `published_word_id` (uuid, nullable — fk-style link to `global_words.id` once approved)

RLS:
- SELECT / INSERT / UPDATE / DELETE: only `has_role(auth.uid(),'moderator')`.
- No public access — public users can never see pending content.

Indexes on `(verification_status, created_at desc)` and `batch_id`.

## 2. Edge functions

### `generate-pending-batch` (new)
Admin-only (verifies moderator role via JWT). Input:
```json
{ "prompt": "poetic insults", "count": 10, "category": "literackie", "difficulty": "advanced", "tags": ["poetic"] }
```
- Loops `count` times, calls the existing Lovable AI gateway (`google/gemini-2.5-pro`) with a prompt that returns: `word`, `definition`, `simplified_definition`, `example_sentence`, `etymology`, `stylistic_tags[]`, `ai_confidence_score`.
- Reuses dedup logic from `generate-word` (skip if word already exists in `global_words` or `pending_words`).
- Inserts every result into `pending_words` with `verification_status='pending'`, `created_by_ai=true`, `dictionary_source='ai:gemini-2.5-pro'`, shared `batch_id`, `batch_prompt`.
- Streams progress back (SSE) so UI shows live count.

### `regenerate-pending-word` (new)
Takes a `pending_words.id`, re-runs the AI generator using the original `batch_prompt` + the existing word as a "regenerate this entry, keep the same headword or pick a better one" instruction, updates the row in place (status stays `pending`).

### Reuse existing `generate-word`
Modify so admin-panel single-word generation also writes to `pending_words` instead of returning straight to the form (toggle via `target: "pending" | "draft"` param so existing manual flow is preserved).

### Reuse existing `classify-words` / `ImportWordsDialog`
Route imports through `pending_words` too (add a `target=pending` flag). Existing manual "Add" form stays as a moderator escape hatch to push straight to `global_words`.

## 3. Approval flow

When a moderator clicks Approve on a pending row:
1. Insert into `global_words` (mapping `example_sentence` → `example`, picking definition/category/difficulty/etymology, dropping `simplified_definition` and `stylistic_tags` unless we extend `global_words` later).
2. Update `pending_words` row: `verification_status='approved'`, `approved_at=now()`, `approved_by=auth.uid()`, `published_word_id=<new id>`.

Done in a Postgres function `approve_pending_word(_id uuid)` (SECURITY DEFINER, role-checked) so it's atomic.

Reject → status `rejected` + optional reason. Keeps the row for audit; hidden from default queue view.

Edit → update fields in place on the pending row before approving.

## 4. Frontend

### New tab in existing `AdminPanel.tsx`
Add a 5th tab `"Pending"` (icon: `ClipboardCheck`) — sits next to Globalne / Wbudowane / Propozycje / Reklamy. Keeps all existing tabs intact.

### New component `PendingWordsPanel.tsx`
Modern moderation table optimized for the project's dark, minimal aesthetic (Playfair display headings, semantic tokens, `bg-secondary`/`border-border`, no custom colors):

Columns: `Słowo` · `Podgląd definicji` (truncated 1 line) · `Źródło` (badge) · `Pewność` (small progress bar of `ai_confidence_score`) · `Tagi` (chips) · `Status` (badge) · `Akcje`.

Row actions (icon buttons): Approve (Check), Reject (X), Edit (Pencil → opens existing dialog pattern), Regenerate (RefreshCw — calls `regenerate-pending-word`).

Top toolbar:
- Search (word/definition).
- Status filter pills: Pending (default) / Approved / Rejected / All.
- Batch filter dropdown (groups by `batch_id` + `batch_prompt`).
- Bulk select + bulk Approve / bulk Reject (reuses existing `selectMode` pattern from `AdminPanel`).

### New component `GenerateBatchDialog.tsx`
Triggered from a "Generuj partię" button in the Pending tab header. Fields:
- Prompt / temat (textarea, with quick-pick chips: "poetyckie wyzwiska", "dark academia", "melancholijne archaizmy", "egzystencjalizm", "barokowe komplementy", custom).
- Liczba słów (slider 1–25, default 10).
- Kategoria + poziom trudności (existing selects).
- Tagi stylistyczne (chip input).

On submit, calls `generate-pending-batch`, shows a progress toast / inline counter, then refreshes the pending list. Never publishes automatically.

### New hook `usePendingWords.ts`
Mirrors `useGlobalWords` shape: `pending`, `loading`, `approve(id)`, `reject(id, reason?)`, `update(id, patch)`, `regenerate(id)`, `refetch`, with status filter. Realtime channel on `pending_words` so multiple admins see updates live.

### Access control
- Tab and all routes/components gated by `useModerator().isModerator`. Non-moderators never see the tab and direct rendering returns null.
- Edge functions check `has_role` server-side before any insert.

## 5. Modularity for future dictionary integrations

- `dictionary_source` + `source_url` are free-form so SJP PWN / WSJP PAN entries can land in the same queue.
- Add a thin server helper `supabase/functions/_shared/dictionary-providers.ts` with an interface:
  ```ts
  interface DictionaryProvider {
    name: string;        // "sjp_pwn" | "wsjp_pan" | "ai:gemini-2.5-pro"
    fetchWord(term: string): Promise<PendingDraft>;
    verify(draft: PendingDraft): Promise<{ ok: boolean; notes?: string }>;
  }
  ```
  Only the AI provider is implemented now; SJP/WSJP are stubs returning "not implemented". The batch function and any future verify-button on a row will route through this registry.

## 6. What is NOT changed

- Existing `global_words`, RLS, public reads, `WordCard`, learning algorithm, packs, quizzes, AI chat, daily email, widget — all untouched.
- Existing `word_suggestions` flow from regular users stays. (It can later be migrated into `pending_words`; out of scope for this plan.)
- Existing manual "Dodaj słowo" form keeps the option to publish directly to `global_words` (moderator-only escape hatch).

## Technical notes

- Language: all UI strings in Polish to match the app (`Oczekujące`, `Zatwierdź`, `Odrzuć`, `Edytuj`, `Regeneruj`, `Generuj partię`).
- Styling: semantic tokens only (`bg-secondary`, `text-foreground`, `border-border`, `text-primary`); no raw colors. Reuse `inputClass` from `AdminPanel`.
- Animation: subtle `motion` fade/slide on row mount, matching existing admin panel.
- Migration order: (1) create `pending_words` + RLS + `approve_pending_word` function, (2) deploy new edge functions, (3) ship UI tab + dialog.
