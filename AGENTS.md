# Kotoba working rules

Kotoba is a JLPT study app: `kotoba-fe` (Next.js 16 App Router, React 19) and `kotoba-be` (NestJS 12, Prisma 7 on SQLite), with learning content in `kotoba-be/content/*.json`. These are the rules for every change to this repository, by a person or an agent.

**Precedence of rule sources.** This file wins over every other rule source. The ponytail plugin is disabled for this repository (`.claude/settings.json`), because its "no boilerplate" rules contradict the mandatory specs, ADRs and tests here. Its useful part stays a rule: choose the simplest solution that meets the spec, and mark a deliberate shortcut with a `ponytail:` comment naming its ceiling. `docs/plan/PLAN.md` is the roadmap; this file is the law.

**Start of session:** read `docs/progress/PROGRESS.md`, then `docs/plan/PLAN.md`. Continue with the first task that is not DONE. Never redo a DONE task.

---

## 1. Priorities

When you have to trade off, prioritise in this order:

1. Do not lose or corrupt user data.
2. Correctness (meets the requirement, correct logic, correct displayed data).
3. Stability (full tests, no flakiness, no regressions).
4. Readability and maintainability.
5. Performance.
6. Speed of delivery.

Never sacrifice a higher item to gain a lower one.

## 2. Working principles

- **Understand first, then act.** Read the requirement and the related code (the file to change, its callers, and its existing tests) before writing the first line.
- **Do not guess.** Do not guess APIs, schemas, file names or library behaviour. If unsure: read the code, read the types, read the library's docs in `node_modules`, or write a small experiment to verify.
- **Small, purposeful changes.** Change only what the task requires. If you see another problem outside the scope, record it in `docs/progress/BUGS.md` or `docs/progress/BACKLOG.md`; do not fix it on the side (except Critical bugs).
- **Data-safety debt is scheduled, not parked.** A BACKLOG item that can lose or corrupt user data (priority 1 in §1) stays there at most until the end of the current phase: by then it has its own task in `PLAN.md` and `PROGRESS.md`, before the next feature or content phase.
- **Follow existing conventions.** New code must look like it was written by the same person as the old code: same folder structure, naming, state patterns and styling.
- **Absolute honesty.** Never say "tested" when you did not run it. Never say "pass" without seeing the output. Never hide failing tests, warnings or unfinished work. Report exactly what actually happened.
- **Bounded autonomy.** Make small decisions yourself and record them (ADR). Stop and ask only in the cases in §15.

## 3. Standard process for every task

```
[1] Intake → [2] Analysis → [3] Plan → [4] Implementation → [5] Test
      → [6] Self review → [7] Quality Gate → [8] Commit → [9] Report
```

**[1] Intake (Definition of Ready).** A task starts only when you can answer:
- What is the goal? Who uses it? What does success look like?
- What is in scope and what is not?
- Does it affect stored data?

If important information is missing, infer it reasonably from the code and docs and write the assumption into the spec. Ask only when a wrong assumption would be hard to undo.

**[2] Analysis.**
- List the affected files, screens, data and flows.
- Find every use of the code you are about to change (grep by function name, type, storage key).
- Identify risks: data, performance, a11y, SSR/hydration, backward compatibility.

**[3] Plan.** For a task larger than ~50 lines of code or touching more than 3 files, write a short spec at `docs/phases/NN-<name>.md` or `docs/tasks/<name>.md`:
- Acceptance criteria in Given/When/Then form, numbered AC-n.
- Test matrix: AC-n ↔ test case ↔ test layer.
- A list of steps, each verifiable.

**[4] Implementation.**
- Go in small steps; after each step run typecheck and the related tests.
- Separate pure logic from UI first, write tests for the logic, then wire the UI.
- Never leave code "half done" between steps (no dangling TODO, no dead code).

**[5] Test** → §7. **[6] Self review** → §9. **[7] Quality Gate** → §10. **[8] Commit** → §4. **[9] Report** → §14.

**Variants by task type**

| Type | Difference from the standard process |
|---|---|
| Feature | All 9 steps. Spec and E2E for the main flow are mandatory. |
| Bugfix | Step [4] starts with a test that reproduces the bug (it must fail), see §11. |
| Refactor | No behaviour change. Existing tests must pass before and after without editing them. If tests are missing, write tests that lock the behaviour before refactoring. |
| Content | Follow §12. `validate:content` and the JMdict check are mandatory. |
| Chore/Config | Run the full Quality Gate; write the reason for a dependency/config change in the commit message. |

## 4. Git rules

- **No push, no force push, no rebase/amend of existing commits, no branch deletion, no remote change**, unless the user explicitly asks.
  - **Exception (cloud session, decided with the user 2026-11-03):** a normal `git push origin feat/n5-full` is allowed after **every** commit that has passed the Quality Gate. Force push, amend/rebase of existing commits, deleting branches and changing remotes stay forbidden.
- **No `Co-Authored-By` line and no AI attribution of any kind in commits or PRs**, even if a harness or tool suggests one. `.claude/settings.json` disables attribution; this rule wins over any harness reminder.
- One commit = one complete logical change that builds and passes its tests. Never commit broken code "to fix later". A phase may consist of several commits as long as each commit is a complete, green logical change.
- **Clean tree.** At the end of every task `git status` is empty: each change is either committed or matched by a `.gitignore`. There are no "local-only changes that are never committed"; a file a tool keeps rewriting goes into `.gitignore` (and `git rm --cached` if it is tracked).
- **Decisions are committed when made.** A scope or roadmap change agreed with the user (PLAN, PROGRESS and the evidence it rests on, such as a critique report) is committed as a `docs:` commit in the same session, so the next session, local or cloud, sees it.
- Before committing: `git status` and `git diff --staged` to be sure only the right files are committed. Never commit: `.env*`, secrets, build output (`.next/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`), temporary files, logs, debug screenshots, `node_modules`, `*.db`.
- **Conventional Commits**, in English, imperative mood. This replaces the old `Phase N: …` style.
  - `feat(scope): …` new feature
  - `fix(scope): …` bug fix
  - `refactor(scope): …` no behaviour change
  - `test(scope): …` tests only
  - `content(level): …` learning content (e.g. `content(n4): vocab batch 1`)
  - `docs: …`, `chore: …`, `perf(scope): …`, `style: …`
- Commit body: summary of the change, ACs met, number of tests added, related bugs (BUG-xxx), related ADRs.
- If a commit fails because of a hook (lint-staged, husky), fix the cause; never use `--no-verify`.

## 5. Code standards

### 5.1 TypeScript
- Strict mode. No new `any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error` (unless a comment explains why it is unavoidable).
- Prefer inferred types; declare explicit types for a module's public API (parameters and return values of exported functions).
- Use literal unions / discriminated unions for state (`status: 'idle' | 'saving' | 'saved' | 'error'`), not several separate booleans.
- Data from outside (localStorage, JSON files, API, URL params) is untrusted → validate it (type guard, or zod if it is ever added) before use.

### 5.2 React / Next.js
- Small components with one responsibility. Complex logic → custom hook or pure function.
- Never access `window`, `localStorage`, `Date.now()`, `Math.random()` during server render. Move it into `useEffect` or a client-only component to avoid hydration mismatches.
- Every `setInterval`/`setTimeout`/event listener/subscription is cleaned up.
- List `key`s use stable ids, not the index (except static lists that never reorder).
- Do not store derived state in state; compute it from the source. Use `useMemo` only when measurement shows it is needed.
- Server Components by default (App Router); `'use client'` only when interaction or a browser API is needed.

### 5.3 Naming and structure
- Descriptive names: `dueCards`, `remainingMs`, `calculateSectionScore`. No cryptic abbreviations.
- Booleans start with `is`/`has`/`can`/`should`.
- No magic numbers/strings: use named constants (`MAX_NEW_ITEMS_PER_DAY = 10`, `N5_EXAM_DURATION_MIN = 60`).
- Business configuration constants live in one place: `kotoba-fe/src/config/` and `kotoba-be/src/config.ts`. Existing constants not yet moved there are tracked in BACKLOG.

### 5.4 Error handling
- Never swallow errors silently: an empty `catch {}` is forbidden in new code. Either handle it, or log it and show an error state to the user. Existing empty catches are listed in BACKLOG and are not fixed on the side.
- Parse JSON/storage inside try/catch, with a safe fallback that never overwrites the original data when parsing fails (back up the broken copy first if you must reset).
- Every screen with asynchronous data has all 4 states: loading, empty, error, data.

### 5.5 Comments
- Comments explain why, not what (the code says what).
- Non-obvious algorithms (SRS, scoring, heatmap) get a short comment describing the rule plus a link to the ADR.
- No commented-out code, no debug `console.log`.

### 5.6 UI text
- Vietnamese with full diacritics and consistent terminology (keep a glossary in `DESIGN.md`).
- Japanese stays as is, uses a CJK-capable font, and furigana uses `<ruby>` where the app has it.
- Displayed text is centralised (the repo's `{ vi, en }` dictionaries), not hard-coded across components.

## 6. Data and storage

- **User progress data is inviolable.** Every structural change must:
  - Bump `schemaVersion`.
  - Have a migration function from every old version to the new one (run in sequence v1→v2→v3…).
  - Have a migration test with a real data fixture of each old version.
  - Never delete an old field before the migration is done and verified.
  - **Additive fields (ADR 002):** bump `schemaVersion` only when a field changes meaning, is renamed or is removed. A new optional field with a default does not bump the version, but it must have a test with a fixture of an old card that lacks the field.
- **Content ids are permanent.** Never change or reuse the id of a released word/kanji/grammar point/question. To retire an item, mark it deprecated; do not delete it.
- **Write data safely:** atomically where possible; never overwrite good data with empty/broken data; handle quota-full errors.
- **Multiple tabs:** consider the `storage` event / `BroadcastChannel`; the conflict strategy must be recorded in an ADR.
- **Time:** store UTC timestamps (ms); convert to a "study day" in the `Asia/Ho_Chi_Minh` time zone in a single function, with midnight-boundary tests.

## 7. Testing standards

### 7.1 Pyramid

| Layer | Tool | Used for | Requirement |
|---|---|---|---|
| Unit | Vitest | Pure logic (SRS, scoring, card picking, migration, export, heatmap) | Coverage per the thresholds in §10 |
| Component | Vitest + RTL + user-event | Rendering data, states, interaction | Every component's empty/error states are tested |
| Integration | Vitest + real storage (jsdom) | Component + hook + storage | Read/write/reload flows |
| E2E | Playwright (`mobile` 360×740 + `desktop` 1440×900, plus a responsive check at 768px) | Multi-screen user journeys, in both apps' flows | Every main flow + axe a11y scan |
| Content | `npm run validate:content` (kotoba-be) | Learning data | Runs in every Quality Gate |

### 7.2 Case groups you must consider

For every feature, go through this list; mark an item that does not apply as N/A with the reason in the spec:

- Happy path
- Boundaries: 0, 1, max, max+1, 1 second left, exactly midnight
- Empty / no data yet
- Wrong/broken/old-version data
- Network error, offline, timeout, storage full
- Concurrency: double click, 2 tabs, overlapping actions
- Time: hidden tab, sleep, reload midway, day rollover, time zone change
- Persistence: reload/close and reopen keeps the right state
- Valid and invalid state transitions
- Navigation: back/forward, direct URL, wrong URL/id → 404
- Keyboard & a11y
- Display: long text, responsive (360, 768, 1440), dark mode (if any), no overflow/overlap
- Performance with large data (≥ 5,000 items)

### 7.3 The "displayed data" rule
- Every dynamic number/label on the UI has a test asserting the exact value, computed from a known fixture. `toBeVisible()` or "the page does not crash" does not count as a data test.
- Cross-check: the same figure shown in several places (dashboard, detail, result, export file) must be equal to each other and to the stored data.
- Check formatting (%, rounding, mm:ss, Vietnamese date/time), sort order, and filter results (no duplicates, nothing missing).

### 7.4 Writing good tests
- Test names describe behaviour: `it('auto-submits exactly once when the timer reaches zero')`.
- Arrange – Act – Assert. One test checks one behaviour.
- Deterministic: fake timers/clock, seeded random, no dependence on run order, no fixed sleeps in E2E (use auto-wait / `expect.poll`).
- Query by user role (`getByRole`, `getByLabelText`); minimise `data-testid`; never query by CSS class.
- Fixtures live in `kotoba-fe/tests/fixtures/` and `kotoba-be/test/fixtures/`, are reused, and have descriptive names (`progress.v1.with-lapses.json`).
- E2E fails on any `console.error` or page error (shared fixture in `kotoba-fe/e2e/fixtures.ts`).
- A new test must be seen failing at least once (invert the assertion or disable the code) to be sure it really tests the right thing.

### 7.5 Forbidden
- `test.skip`, `.only`, `xit`, commented-out tests, deleting assertions, loosening assertions to make them pass.
- Changing a test to match wrong code. If a test really is wrong → fix the test and give the reason in the commit.
- Mocking the module under test.
- Snapshot tests of large components in place of meaningful assertions.

## 8. UI, a11y, performance, security

### 8.1 Accessibility (target Lighthouse a11y ≥ 95, axe 0 serious/critical)
- Semantic HTML (`button` for actions, `a` for navigation, correct heading levels).
- Every control has a label; icon-only buttons have `aria-label`.
- Fully keyboard operable; focus always visible; modals trap focus and return it on close.
- Dynamic announcements (save status, time up, results) via `aria-live` at a sensible level, not spamming every second.
- Colour is never the only channel of information (right/wrong, heatmap). Contrast ≥ 4.5:1.
- Keyboard shortcuts: have a help panel, do not fire while an input has focus, do not override browser/screen-reader shortcuts.

### 8.2 Responsive & display
- Check at 360px, 768px and 1440px. No horizontal scroll, no overflowing text, touch targets ≥ 44×44px on mobile.
- After a UI change: take Playwright screenshots at mobile (360×740) and desktop (1440×900) and look at them before concluding.

### 8.3 Performance
- Large lists: pagination or virtualisation.
- Do not import a whole large library for one function; dynamic import for heavy, rarely used parts.
- Do not block the main thread on large data; measure before/after optimising and put the numbers in the report.

### 8.4 Security & privacy
- No `dangerouslySetInnerHTML` with unsanitised data.
- Do not log/export sensitive data; an export file contains only study progress (and profile), never passwords or tokens.
- Never commit secrets; public env variables must have the right prefix (`NEXT_PUBLIC_`) and never contain secrets.
- New dependency: check popularity, maintenance and licence; record the reason (ADR).

## 9. Self code review checklist (run on `git diff` before every commit)

**Correctness**
- [ ] Meets every AC, nothing extra outside the scope
- [ ] Handles empty / error / loading / boundary states
- [ ] Does not break compatibility with old data (migration + test if the schema changed)

**Quality**
- [ ] Clear names, short functions, no duplication, no magic numbers
- [ ] No `any`, `ts-ignore`, `console.log`, dead code, dangling TODO
- [ ] Full cleanup (timers, listeners, subscriptions)
- [ ] No hydration mismatch, no obvious extra re-renders

**Tests**
- [ ] Every AC has a test; the §7.2 groups were considered
- [ ] Every new displayed figure has an exact-value test
- [ ] Tests are deterministic, not flaky, and were seen failing at least once

**UI/a11y**
- [ ] Keyboard, focus, labels, `aria-live`, contrast
- [ ] Mobile + desktop screenshots looked at

**Docs**
- [ ] Spec/ADR/PROGRESS/BUGS updated

Write the issues you found and fixed yourself at the end of the task's spec file.

## 10. Quality Gate (Definition of Done)

A task is done only when all of these hold, and the commands were actually run:

- [ ] lint: 0 errors, 0 new warnings
- [ ] typecheck: 0 errors
- [ ] test: 100% pass; coverage:
  - FE: hard threshold of **90% lines and branches for `kotoba-fe/src/lib/**`**, enforced in `kotoba-fe/vitest.config.ts`.
  - BE: threshold enforced in `kotoba-be/vitest.config.ts` (started at the phase 13.5 baseline). **Ratchet:** at the end of every phase, set each BE threshold to the measured `test:cov` value rounded down, in that phase's commit. The BE threshold may only be raised, never lowered. New BE code must have tests. The gap to 90% is tracked in BACKLOG.
- [ ] test:e2e: 100% pass on mobile + desktop; axe 0 serious/critical; no console errors
- [ ] validate:content: pass
- [ ] build: succeeds, no new warnings
- [ ] §9 checklist done
- [ ] Docs updated
- [ ] Committed per §4

If an item cannot be met → do not commit; report the cause clearly and what was tried.

## 11. Bug process

1. Record it in `docs/progress/BUGS.md` with an id `BUG-xxx`:
   - Description, reproduction steps, expected, actual, environment.
   - Severity: **Critical** (data loss, crash, blocks the main flow) / **High** (wrong result, wrong figures) / **Medium** (minor bug, workaround exists) / **Low** (cosmetic).
2. Reproduce it with a test (unit if possible, E2E if needed); the test must fail.
3. Find the root cause (ask "why" until you reach it). Do not patch the symptom; do not add a special-case `if` for exactly one case.
4. Fix it; the test turns green and stays as a regression test.
5. Scan for similar places with the same kind of bug and fix them too.
6. Update BUGS.md: root cause, fix, test, commit.

Priority: Critical is fixed immediately (separate `fix:` commit) before continuing; High is fixed within the current task; Medium/Low go to the backlog if out of scope.

After 3 attempts in 3 different directions without a fix → stop, report what was tried and the current hypothesis.

## 12. Learning content rules (vocabulary, kanji, grammar, mock tests)

- **Do not invent.** Every reading must be checked against JMdict with `kotoba-be/scripts/jmdict-check.ts` (`npm run jmdict` in `kotoba-be`). If unsure → keep `reviewed: false` and list it in the report. (`reviewed: false` is the existing field in the JSON and plays the role of a "needs review" flag; it is not renamed, to avoid a migration.)
- Every item has all fields required by the schema, including `level`. A word belongs to exactly one level.
- **Kanji gate:** every kanji in a word's `word` must be in `kanji.json` with a `level` ≥ the word's level (the same level or easier). Otherwise write `word` in kana and put the kanji spelling in the `kanji` field. There is no `kanaOnly` flag: see `vocab:ねこ`.
- No duplicates (same written form + same reading) across all data.
- Vietnamese meanings are natural, short and right for the context; examples are grammatical and translated.
- Mock tests: use content from that level or lower; plausible distractors; every question has an explanation (`explain`); the duration matches the level's configuration.
- Author in batches of ~200 items, one commit per batch `content(<level>): …`, running `validate:content` + JMdict before the commit.
- **Human review gate.** JMdict checks readings only, so meanings, examples and explanations need a person.
  - Only the user sets `reviewed: true`. An agent never does.
  - Every content batch report ends with a sample for the user: 30 items (or the whole batch if smaller) chosen at random with a seed written in the report, each with id, written form, reading, Vietnamese meaning and example (for test questions: the question, answer and `explain`).
  - If more than 5% of a sample is wrong, the batch is fixed and a new sample is drawn before the next batch.
  - Content of a new level starts only after the user has checked the samples of the previous level (§15).
- Data sources and licences (JMdict/KANJIDIC – EDRDG) are credited in the README.

## 13. Documents to maintain

| File | Content | When to update |
|---|---|---|
| `docs/progress/PROGRESS.md` | Status of each phase/task, baselines, test counts | Start and end of every task |
| `docs/progress/BUGS.md` | Every bug, severity, cause, fix | When a bug is found / fixed |
| `docs/progress/BACKLOG.md` | Out-of-scope findings | When found |
| `docs/phases/*.md`, `docs/tasks/*.md` | Spec, AC, test matrix, review results | Before coding, after review |
| `docs/decisions/NNN-*.md` | ADR: Context, Options, Decision, Consequences | Each decision affecting data/architecture/behaviour |
| `DESIGN.md` (`kotoba-fe/DESIGN.md`) | Architecture, data model, algorithms, UI conventions, glossary | When the architecture changes |
| `README.md` | Setup, scripts, how to test, how to add content | When the process changes |

`PROGRESS.md` is the source of truth for resuming an interrupted session: read it first at the start of every session.

## 14. Communication & reporting

- Write reports in Vietnamese, concise, with concrete facts (test counts, commit hashes, file names).
- Do not narrate every step; focus on results, decisions and risks.
- Report template after each task:

```
## <Task/Phase>: <name> — DONE | BLOCKED | PARTIAL
- Commit: <hash> <message>
- AC: x/y met (not met: AC-n — reason)
- Test: +a unit, +b component, +c e2e | total N | logic coverage x%
- Quality Gate: lint ✓ typecheck ✓ test ✓ e2e ✓ content ✓ build ✓
- Bug: found n, fixed m (BUG-xxx…)
- Decisions to review: ADR-xxx …
- reviewed:false: …
- Risks / remaining work: …
```

## 15. When to stop and ask

Stop and ask only when:

- A change could delete/corrupt user data and cannot be migrated safely.
- Requirements contradict each other in a way that changes the data model or the core experience.
- An irreversible operation outside the repo is needed (push, deploy, deleting real data, changing an external service). **Exception:** the normal push to `origin feat/n5-full` after a green commit (§4) needs no question.
- A required resource is missing (JMdict file, credentials, access, Node < 24).
- You are stuck after 3 different attempts.
- **A JLPT level is finished** (its last phase is DONE). Stop and ask the user to: use the app for about 10 minutes on that level, check the open content samples (§12), and decide whether to merge `feat/n5-full` into `main`. Automated gates only check what the spec foresaw; this checkpoint catches what a person sees at a glance.

Otherwise: choose the most reasonable option, record an ADR, continue, and put it in the report for review.

When asking: give the context in 1–2 sentences, the options (with the recommended one), and the consequences of each.

## 16. FORBIDDEN list (summary)

- ❌ Force push, amend/rebase of old commits, `--no-verify`, deleting branches, changing remotes. (A normal push to `origin feat/n5-full` after a green commit is allowed, §4.)
- ❌ `Co-Authored-By` or any AI attribution in commits/PRs
- ❌ Committing while the Quality Gate is not green
- ❌ Skipping/deleting/loosening tests to pass
- ❌ Saying tested/passed without actually running it
- ❌ Changing released content ids, changing the schema without a migration
- ❌ Inventing readings, meanings or examples; skipping the JMdict check
- ❌ An agent setting `reviewed: true`; starting a new level's content before the user checked the previous level's samples
- ❌ Ending a task with a dirty `git status`
- ❌ `any`, `ts-ignore`, `console.log`, empty `catch {}`, commented-out code
- ❌ Sprawling changes outside the task's scope
- ❌ Adding unnecessary dependencies, or any dependency without a recorded reason
- ❌ Committing secrets, build output, temporary files

## 17. Common commands

There is no `package.json` at the repo root. Requires Node ≥ 24 (scripts use type stripping).

**`kotoba-be/`** (copy `.env.example` to `.env` first)

```bash
npm run start:dev         # API on 127.0.0.1:4000 (prestart runs prisma migrate deploy)
npm run lint              # oxlint --type-aware src/ test/
npm run typecheck         # tsc --noEmit
npm test                  # Vitest unit (src/*.spec.ts, content/content.spec.ts)
npm run test:cov          # unit with coverage (threshold = baseline)
npm run test:e2e          # supertest e2e on test.db
npm run validate:content  # vitest run content + scripts/jmdict-check.ts
npm run jmdict            # JMdict reading/example check only
npm run kanjidic          # regenerate kanji.json from KANJIDIC2 (keeps authored fields)
npm run build             # nest build
npm run check             # lint + typecheck + test + test:e2e + validate:content + build
```

**`kotoba-fe/`**

```bash
npm run dev               # Next dev server on :3000 (needs kotoba-be on :4000)
npm run lint              # ESLint
npm run typecheck         # next typegen && tsc --noEmit (route types must exist first)
npm test                  # Vitest unit + component
npm run test:coverage     # Vitest with coverage (90% lines/branches on src/lib/**)
npm run test:e2e          # Playwright (starts BE and FE itself), mobile + desktop, axe
npm run build             # next build
npm run check             # lint + typecheck + test:coverage + build (E2E runs separately)
```

Full Quality Gate for a phase: `npm run check` in both apps, then `npm run test:e2e` in `kotoba-fe`.

---

## Agents

Subagents live in `.claude/agents/`: `be`, `fe`, `test`, `content`, `reviewer`.

- Only the main agent commits, pushes and updates `PROGRESS.md`. Subagents never commit or push.
- `be` and `fe` run in parallel only when they edit disjoint files.
- Only one agent at a time runs `test:e2e` or Playwright, since they share ports :4000/:3000 and `dev.db`/`test.db`. When the main agent runs two agents in parallel, it writes "another agent is running in parallel" in both prompts: those subagents then skip e2e, and the main agent runs e2e afterwards.
- Tests written by `test` are the contract: `be`/`fe` must not edit or loosen them. If a test is wrong, they report back and the main agent decides.
- Standard flow of a phase:
  1. The main agent writes the spec (`docs/phases/NN-<name>.md`).
  2. `test` writes failing tests.
  3. `be` and/or `fe` make the tests pass.
  4. `reviewer` reviews the diff.
  5. The main agent runs the Quality Gate, commits, pushes, then updates PROGRESS.
- Small phases (one or two files) are done by the main agent alone, without subagents.
- Content phases are delegated to `content` batch by batch, one call per batch.
