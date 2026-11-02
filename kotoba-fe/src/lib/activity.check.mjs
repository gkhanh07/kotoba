// Run: node --experimental-strip-types src/lib/activity.check.mjs
import assert from "node:assert/strict";
import { continueHref, dayKey, daysBetween, parseActivity, record, summarize } from "./activity.ts";

const now = new Date(2026, 9, 16, 20, 30);
const ago = (n) => new Date(2026, 9, 16 - n, 12);
const day = (n = 1) => ({ minutes: Array.from({ length: n }, (_, i) => i), kana: [], vocab: [] });

assert.equal(dayKey(new Date(2026, 0, 5)), "2026-01-05");
assert.equal(daysBetween(new Date(2026, 9, 16, 23), new Date(2026, 11, 6)), 51);
assert.equal(daysBetween(now, now), 0);

// record: distinct minutes and refs, never mutates, trims old days
const empty = { days: {} };
let a = record(empty, "kana", "hiragana:ka", now);
a = record(a, "kana", "hiragana:ka", now);
const today = a.days[dayKey(now)];
assert.equal(today.minutes.length, 1);
assert.equal(today.kana.length, 1);
assert.deepEqual(empty, { days: {} });
const before = structuredClone(a);
a = record(a, "kana", "hiragana:ki", new Date(2026, 9, 16, 20, 31));
assert.equal(before.days[dayKey(now)].kana.length, 1);
assert.equal(a.days[dayKey(now)].kana.length, 2);
assert.equal(a.days[dayKey(now)].minutes.length, 2);
assert.deepEqual(a.last, { area: "kana", ref: "hiragana:ki" });
const old = record({ days: { [dayKey(ago(91))]: day(), [dayKey(ago(89))]: day() } }, "vocab", "water", now);
assert.ok(!old.days[dayKey(ago(91))] && old.days[dayKey(ago(89))]);

// summarize: streak counts back from today, or yesterday if today is empty
const log = (...ns) => ({ days: Object.fromEntries(ns.map((n) => [dayKey(ago(n)), day()])) });
assert.equal(summarize(log(0, 1, 2), now).streak, 3);
assert.equal(summarize(log(1, 2), now).streak, 2);
assert.equal(summarize(log(2), now).streak, 0);
assert.equal(summarize({ days: {} }, now).streak, 0);
const s = summarize(log(0, 1, 2, 3, 4, 5, 6, 7, 8), now);
assert.equal(s.recent.length, 7);
assert.equal(s.recent[0].day, dayKey(now));
assert.equal(s.recent[6].day, dayKey(ago(6)));
assert.deepEqual(summarize(a, now).today, { kana: 2, vocab: 0 });
assert.equal(summarize(a, now).minutesToday, 2);

// parseActivity: missing → empty, broken → null
assert.deepEqual(parseActivity(null), { days: {} });
for (const bad of ["broken", "!unavailable", '{"days":[]}', "null", "5",
  JSON.stringify({ days: {}, last: { area: "kanji", ref: "x" } }),
  JSON.stringify({ days: { "2026-10-16": { minutes: ["1"], kana: [], vocab: [] } } })]) assert.equal(parseActivity(bad), null, bad);
assert.deepEqual(parseActivity(JSON.stringify(a)), a);

assert.equal(continueHref(undefined), "/kana?script=hiragana&mode=quiz");
assert.equal(continueHref({ area: "kana", ref: "katakana:ka" }), "/kana?script=katakana&mode=quiz");
assert.equal(continueHref({ area: "vocab", ref: "water" }), "/flashcards");
console.log("activity ok");
