# Backlog

Out-of-scope findings (AGENTS.md §2, §13). Not fixed in the task that found them.

## Rule deviations in existing code (found in Task A, 2026-11-03)

### Empty `catch {}` (AGENTS.md §5.4; the ban applies to new code)
- `kotoba-fe/src/lib/activity.ts:63`
- `kotoba-fe/src/lib/store.ts:77`
- `kotoba-fe/src/lib/store.ts:99`
- `kotoba-fe/src/lib/store.ts:109`
- `kotoba-fe/src/lib/store.ts:117`

Each should either handle the error (e.g. mark the deck as `ok: false`) or report it, without overwriting stored data.

### Business constants not yet in `src/config/` (AGENTS.md §5.3)
- `kotoba-fe/src/lib/srs.ts`: `INTERVALS` (Leitner days 1/3/7/14/30) and `KNOWN_AT`.
- Other constants found later go here too. New constants go straight to `kotoba-fe/src/config/` or `kotoba-be/src/config.ts`.

### Docs
- README does not yet credit the JMdict/KANJIDIC2 sources and the EDRDG licence (AGENTS.md §12). `kotoba-be/README.md` is still the Nest starter text. Planned for phase 35.

### BE coverage below 90%
- See PROGRESS.md "Baseline" for the measured BE unit coverage. Controllers, `validate.ts`, `db.ts`, `mailer.ts` and `main.ts` are only exercised by the supertest e2e suite, which is not counted. Raising unit coverage of `src/` to 90% is backlog; the threshold in `kotoba-be/vitest.config.ts` may only be raised.

## Phase 14 follow-ups
- `kotoba-fe/src/app/test/error.tsx` has no automated test (BE down while loading `/test`).
- `TestApp` ←/→ call `preventDefault` whenever focus is outside an input, which overrides horizontal scrolling by arrow keys (AGENTS.md §8.1, minor).
- `e2e/test.spec.ts` uses non-null `!` in four places (test-only).
