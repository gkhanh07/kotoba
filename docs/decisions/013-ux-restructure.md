# ADR 013: Five-place navigation and one focused study session

- Status: accepted
- Date: 2026-11-15

## Context
The app grew area by area (kana, kanji, vocab, grammar, tests, review hub). A learner had to choose where to go every day. Phase 41 asks for a structure where the first screen answers "what do I study today" and one session walks through it.

## Decision
- Five places: Hôm nay (`/`), Lộ trình (`/lessons`), Luyện tập (`/review`), Thư viện (`/library`), Tiến độ (`/progress`). Old URLs stay.
- One session route, `/session`, built by a pure `buildSession` from the current lesson: due reviews → new items in chunks of 3 with a quick check → grammar → sentence ordering → fill-in practice → results. `?mode=review` is reviews only; `?mode=more` adds new items past the daily cap.
- The session is a focus mode: no site nav, an Exit with confirmation, a segmented progress bar, a sticky primary button.
- Leitner boxes stay as they are (ADR 004/007): a miss goes to box 0 and the step comes back at the end of the session.
- Session position is kept locally (`kotoba.session.v1`) for the study day only; it is not synced (a half-done session on another device is not worth a sync format).

## Consequences
- The old review queue (`/review?start=1`, `?lesson=`, `?kind=`, `?weak=1`, `?saved=1`) stays for scoped queues; the daily path goes through `/session`.
- Lessons are never locked; only one shows "Học tiếp".
