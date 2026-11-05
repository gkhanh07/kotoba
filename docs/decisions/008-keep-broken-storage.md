# ADR 008: what happens to stored data that cannot be read

- Status: accepted
- Date: 2026-11-05

## Context
AGENTS.md §5.4: parsing errors must never overwrite the original; a reset needs a backup first. The store did overwrite: a broken deck became `{}` and the next grade replaced it (BUG-013). A stored value can break through a browser fault, a manual edit or an older build.

## Options
- (a) Refuse to write over a broken key. The original is safe, but nothing persists again until someone repairs it, and the app has no way to do that.
- (b) Copy the broken text to `<key>.broken`, then carry on with an empty value. The learner can keep studying and the text can still be recovered by hand.
- (c) As (b), plus a screen to download or repair the copy. No learner has hit this, so it is not worth building yet.

## Decision
(b), and (a) only when the copy itself cannot be saved.
- The first broken copy stays. Later ones are not kept: `read()` runs on every render, and the first is the closest to what was lost.
- Damaged sync data keeps what is valid: `owner` and well-formed `forget` entries. `lastSync` goes to 0, because resending too much is safe (the account merges by time) and sending too little is not.
- `resetDeck` queues the `forget` entry first and changes nothing if that fails: otherwise the next pull would restore the cards.
- `applyRemote` restores the old values if any write fails, so one browser never holds cards of one account and the activity or owner of another.
- Sign-out removes the copies, like all other data of the account.

## Consequences
- The warning shows until the first write, then the app looks normal again with the copy in storage. The console gets an error when a copy is made. A learner is not told in the UI that a copy exists.
- Sync data that does not parse at all loses `owner` and `forget`: the next sign-in counts as a first sync, so unsent resets can come back. Those cards return rather than disappear, and the text stays in the copy.
- No migration: `.broken` keys are new and optional (ADR 002).
