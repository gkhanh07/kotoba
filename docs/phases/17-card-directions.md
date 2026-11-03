# Phase 17: cards asked in several directions

Roadmap: `docs/plan/PLAN.md` §17 and the "Hướng của card" decision (one schedule per item, direction picked at random each time). Rules: `AGENTS.md`.

## Goal
Recognising a word is easier than recalling it. Each time a vocab or kanji card comes up, ask it in one of several directions, while the SRS schedule stays one per item.

## Scope
In: pure `prompt(item, rand)` in `src/lib/library.ts`; `ReviewApp` and `FlashcardApp` call it when a new card is shown; `Space` and `1`/`2` shortcuts in `FlashcardApp` (same pattern as `ReviewApp`).
Out: separate schedules per direction, typing answers, kana directions (kana stays as is).

## Behaviour
- `PromptSource = { kind: "kana" | "kanji" | "vocab"; word: string; reading?: string; meaning: string }`.
- `prompt(src, rand)` → `{ dir, front, frontIsJa }`, where `dir` is one of
  - `"word-meaning"`: front = word (Japanese), asks for the meaning;
  - `"meaning-word"`: front = meaning (UI language), asks for the word;
  - `"word-reading"`: front = word, asks for the reading — only vocab with `reading !== word`.
- Available directions: kana → `[word-meaning]` only (unchanged behaviour); kanji → `[word-meaning, meaning-word]`; vocab → `[word-meaning, meaning-word]` plus `word-reading` when `reading !== word`.
- Choice: `dirs[Math.floor(rand() * dirs.length)]`, with `rand()` in `[0, 1)`; a `rand` returning ≥ 1 is clamped to the last direction.
- Only the **front face** and its recall hint change with the direction; the back face keeps the full answer (word, reading, meaning, example) as today. Grading still calls `review(item.id, knew)`.
- The direction is chosen once when a card is shown (on index change / new queue), not on every render, and not during server render (no `Math.random()` on the server: the first card's direction is picked after mount; before that the default `word-meaning` is shown, which is also what the server renders).
- Hints (vi / en): word-meaning "nhớ nghĩa" / "recall the meaning"; meaning-word "nhớ từ tiếng Nhật" / "recall the Japanese"; word-reading "nhớ cách đọc" / "recall the reading". Kana keeps "nhớ cách đọc".
- `FlashcardApp` keys: `Space` flips (not when focus is on a link/button/summary other than the card itself — same rule as ReviewApp), `1` = "Chưa nhớ", `2` = "Nhớ rồi" (only when flipped); ignored with modifiers, in inputs, and on key repeat; listener removed on unmount. The hint on the card mentions the keys (reuse the ReviewApp wording).

## Acceptance criteria
- **AC-1** `prompt` returns exactly the directions above per kind, picked by `rand` (seeded tests: 0, 0.34, 0.67, 0.99, 1).
- **AC-2** A vocab whose `reading === word` (kana word) never gets `word-reading`.
- **AC-3** `ReviewApp` shows the meaning on the front for `meaning-word` (with `lang` of the UI) and the word for the other two; the back face is unchanged; grading records against `item.id`.
- **AC-4** `FlashcardApp` does the same for vocab.
- **AC-5** `FlashcardApp`: `Space` flips, `1`/`2` grade when flipped, nothing when not flipped, nothing in inputs or with modifiers.
- **AC-6** No hydration warning: server HTML and first client render match (default direction), no console errors.
- **AC-7** E2E: with `Math.random` stubbed via `page.addInitScript` to a fixed sequence, all three directions appear on the same vocab set in `/review`; shortcuts work on `/flashcards`. Axe clean, both projects.

## Test matrix
| AC | Test | Layer |
|---|---|---|
| AC-1, AC-2 | `src/lib/library.test.ts` `prompt` | Vitest |
| AC-3 | `src/app/review/ReviewApp.test.tsx` with a stubbed `Math.random` | RTL |
| AC-4, AC-5 | `src/app/flashcards/FlashcardApp.test.tsx` | RTL |
| AC-6, AC-7 | `e2e/directions.spec.ts` (fixture fails on console errors) | E2E |

## §7.2 case groups
- Boundaries: `rand` 0, just under 1, exactly 1 (clamped); vocab with kana-only word.
- Empty: empty deck → existing empty states (unchanged).
- Old data / storage: N/A (no stored data changes; direction is not persisted).
- Network, time, persistence: N/A (pure UI choice; reload picks a new direction by design).
- Concurrency: double key press — key repeat ignored; grade only when flipped.
- Navigation: N/A (no new routes).
- Keyboard & a11y: AC-5; front text keeps `lang="ja"` only for Japanese.
- Display: long Vietnamese meanings on the front wrap at 360px (E2E screenshot).
- Large data: N/A.

## Self-review notes
(filled in after review)
