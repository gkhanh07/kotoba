// Run: node --experimental-strip-types src/lib/flashcards.check.mjs
import assert from "node:assert/strict";
import { flashcardText, shuffleCards } from "./flashcards.ts";
const ids = Array.from({ length: 12 }, (_, i) => `vocab:${i}`);
for (let i = 0; i < 30; i++) {
  const shuffled = shuffleCards(ids);
  assert.notEqual(shuffled, ids);
  assert.deepEqual([...shuffled].sort(), [...ids].sort());
}
assert.equal(ids[0], "vocab:0"); // input untouched
assert.deepEqual(shuffleCards([]), []);
assert.deepEqual(shuffleCards(["one"]), ["one"]);
assert.deepEqual(Object.keys(flashcardText.vi).sort(), Object.keys(flashcardText.en).sort());
console.log("flashcards ok");
