// Run: node --experimental-strip-types src/lib/progress.check.mjs
import assert from "node:assert/strict";
import { applyAnswer, choicesFor, isMastered, pickNext, resetScript } from "./progress.ts";

const items = ["a", "i", "u", "e", "o"].map((r) => ({ id: `hiragana:${r}` }));
let p = {};

p = applyAnswer(applyAnswer(p, "hiragana:a", true), "hiragana:a", true);
assert.equal(isMastered(p, "hiragana:a"), false);
p = applyAnswer(p, "hiragana:a", false); // a miss resets the streak
assert.equal(p["hiragana:a"].streak, 0);
for (let i = 0; i < 3; i++) p = applyAnswer(p, "hiragana:a", true);
assert.equal(isMastered(p, "hiragana:a"), true);

for (let n = 0; n < 50; n++) {
  const q = pickNext(items, p, "hiragana:i");
  assert.notEqual(q.id, "hiragana:a"); // mastered never asked
  assert.notEqual(q.id, "hiragana:i"); // no immediate repeat
  const c = choicesFor(q, items);
  assert.equal(c.length, 4);
  assert.equal(new Set(c.map((k) => k.id)).size, 4);
  assert.ok(c.includes(q));
}

// Same reading, different letter: never two right answers on screen.
const voiced = [["ji", "じ"], ["ji", "ぢ"], ["zu", "ず"], ["zu", "づ"], ["za", "ざ"], ["ze", "ぜ"]].map(([romaji, c]) => ({ id: `hiragana:${c}`, romaji }));
for (let n = 0; n < 50; n++) {
  const c = choicesFor(voiced[0], voiced);
  assert.equal(new Set(c.map((k) => k.romaji)).size, c.length);
  assert.ok(!c.some((k) => k.id === "hiragana:ぢ"));
}

for (const k of items) for (let i = 0; i < 3; i++) p = applyAnswer(p, k.id, true);
assert.equal(pickNext(items, p, null), null); // all mastered -> empty state
assert.deepEqual(resetScript({ ...p, "katakana:a": { streak: 1, seen: 1 } }, "hiragana"), { "katakana:a": { streak: 1, seen: 1 } });

console.log("progress ok");
