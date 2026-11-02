// Run: node --experimental-strip-types src/lib/srs.check.mjs
import assert from "node:assert/strict";
import { KNOWN_AT, addDays, apply, daysUntil, choicesFor, dueCount, forget, isKnown, migrate, parseSrs, pickNext, queue } from "./srs.ts";

const D = "2026-11-02";
assert.equal(addDays("2026-12-30", 3), "2027-01-02");
assert.equal(addDays("2027-03-27", 1), "2027-03-28"); // DST weekend in Europe: still one calendar day
assert.equal(daysUntil("2027-01-02", "2026-12-30"), 3);
assert.equal(daysUntil("2026-12-30", "2026-12-30"), 0);

// Box climbs 1/3/7/14/30 days, each hit only once the card is due.
let s = {};
let day = D;
const gaps = [];
for (let i = 0; i < KNOWN_AT; i++) {
  s = apply(s, "k", true, day, 0);
  gaps.push(s.k.due === day ? 0 : Math.round((Date.parse(s.k.due) - Date.parse(day)) / 864e5));
  day = s.k.due;
}
assert.deepEqual(gaps, [1, 3, 7, 14, 30, 30]);
assert.equal(isKnown(s, "k"), true);

// Early hit changes nothing; a miss always resets to box 0, due today.
const one = apply({}, "k", true, D, 1);
assert.equal(apply(one, "k", true, D, 2), one);
assert.deepEqual(apply(one, "k", false, D, 3).k, { box: 0, due: D, at: 3 });

// Queue: due → new → extra, never the same item twice in a row.
const items = ["a", "i", "u"].map((r) => ({ id: `hiragana:${r}` }));
assert.equal(queue(items, {}, D).mode, "new");
const missed = apply(apply({}, "hiragana:a", true, D, 0), "hiragana:i", false, D, 0);
assert.deepEqual(queue(items, missed, D), { mode: "due", items: [items[1]] });
assert.equal(dueCount(missed, D), 1);
const allSeen = { ...missed, "hiragana:i": one.k, "hiragana:u": one.k };
assert.equal(queue(items, allSeen, D).mode, "extra");
for (let n = 0; n < 30; n++) assert.notEqual(pickNext(items, allSeen, "hiragana:u", D).id, "hiragana:u");
assert.equal(pickNext([], {}, null, D), null);

for (let n = 0; n < 50; n++) {
  const c = choicesFor(items[0], items);
  assert.equal(c.length, 3);
  assert.equal(new Set(c.map((k) => k.id)).size, 3);
}
// Same reading, different letter: never two right answers on screen.
const voiced = [["ji", "じ"], ["ji", "ぢ"], ["zu", "ず"], ["zu", "づ"], ["za", "ざ"], ["ze", "ぜ"]].map(([romaji, c]) => ({ id: `hiragana:${c}`, romaji }));
for (let n = 0; n < 50; n++) {
  const c = choicesFor(voiced[0], voiced);
  assert.equal(new Set(c.map((k) => k.romaji)).size, c.length);
  assert.ok(!c.some((k) => k.id === "hiragana:ぢ"));
}

assert.deepEqual(Object.keys(forget({ "hiragana:a": one.k, "katakana:a": one.k }, "hiragana:")), ["katakana:a"]);
assert.equal(parseSrs("[]"), null);
assert.equal(parseSrs("broken"), null);
assert.equal(parseSrs('{"x":{"box":"1"}}'), null);
assert.deepEqual(parseSrs(JSON.stringify(s)), s);

// Old keys: kana streak → box, flashcard status → box under the new vocab id; junk ignored.
const m = migrate(
  JSON.stringify({ "hiragana:a": { streak: 3, seen: 5 }, "hiragana:i": { streak: 1, seen: 1 }, "hiragana:u": { streak: 0, seen: 2 }, bad: 1 }),
  JSON.stringify({ water: "learned", cat: "learning", book: "new", unknown: "learned" }),
  D, 9,
);
assert.deepEqual(m, {
  "hiragana:a": { box: 2, due: D, at: 9 }, "hiragana:i": { box: 1, due: D, at: 9 }, "hiragana:u": { box: 0, due: D, at: 9 },
  "vocab:水": { box: 2, due: D, at: 9 }, "vocab:ねこ": { box: 0, due: D, at: 9 },
});
assert.deepEqual(migrate(null, "broken", D, 0), {});

console.log("srs ok");
