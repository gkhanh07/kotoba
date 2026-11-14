# ADR 011: Ids for vocab that shares its written form with another word

- Status: accepted
- Date: 2026-11-14

## Context
A vocab id is `vocab:<word>` (checked in `kotoba-be/content/content.spec.ts`, "ids follow their kind"). The kanji gate of AGENTS.md §12 makes `word` kana whenever a kanji is above the word's level, so two different words can end up with the same `word`: 紙/髪 (かみ), 橋/箸 (はし), 公園/公演 (こうえん). The second word could not be added, and phases 15 and 28 skipped about 70 of them (list in `docs/progress/BACKLOG.md`, "Content (phase 15)").

Ids are permanent (AGENTS.md §6): they are the keys of user progress in localStorage (`kotoba.srs.v1`) and in the server `Card` table, so no released id may change.

## Options
1. Rename every colliding pair to a new scheme (e.g. `vocab:<reading>:<kanji>` for all words). Breaks released ids; needs a progress migration on FE and BE.
2. Keep every released id; give only a **new** word whose `vocab:<word>` is already taken the id `vocab:<word>:<kanji>`, where `<kanji>` is its `kanji` field (the kanji spelling).
3. Add a numeric suffix (`vocab:かみ:2`). Stable, but the id says nothing about which word it is, and the order of authoring decides the number.

## Decision
Option 2.
- Existing ids stay exactly as they are, whichever homophone they belong to.
- A new word uses `vocab:<word>`. Only if that id is taken does it use `vocab:<word>:<kanji>`; such a word must have a `kanji` field, and the pair (`word`, `kanji`) must be unique.
- The content check accepts `vocab:<word>` or `vocab:<word>:<kanji>` and nothing else.
- The word page and links address a word by the part of its id after `vocab:` (URL-encoded), not by `word`, so both homophones get their own page. Old `/vocab/<word>` URLs keep working because the old id's suffix is `word`.
- No change to stored progress: card keys are ids, and no released id changes, so no `schemaVersion` bump or migration is needed.

## Consequences
- Phase 39 adds the skipped words with `reviewed: false` and the JMdict check, and changes the id rule in `content.spec.ts`, the word page route and `getVocabItem` (which today builds the id from `word`).
- Two ids can share a `word`; any code that looks a word up by `word` alone (search, links from examples) must be checked in phase 39.
- The scheme is not uniform (the first homophone has the short id). Accepted: uniformity would cost a migration of user data, which priority 1 of AGENTS.md §1 rules out for a cosmetic gain.
