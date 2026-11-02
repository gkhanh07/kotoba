// Run: node --experimental-strip-types src/lib/flashcards.check.mjs
import assert from "node:assert/strict";
import { flashcards, parseStatuses, shuffleCards } from "./flashcards.ts";
assert.equal(new Set(flashcards.map(card => card.id)).size, flashcards.length);
for (const card of flashcards) {
  assert.ok(card.word && card.reading && card.pronunciation && card.example);
  for (const lang of ["vi", "en"]) assert.ok(card.meaning[lang] && card.translation[lang]);
}
const ids = flashcards.map(card => card.id);
for (let i = 0; i < 30; i++) {
  const shuffled = shuffleCards(ids);
  assert.notEqual(shuffled, ids);
  assert.deepEqual([...shuffled].sort(), [...ids].sort());
}
assert.deepEqual(ids, flashcards.map(card => card.id));
assert.deepEqual(shuffleCards([]), []);
assert.deepEqual(shuffleCards(["one"]), ["one"]);
assert.deepEqual(parseStatuses(null), {});
assert.deepEqual(parseStatuses('{"water":"learned","book":"learning","cat":"new","rain":"bad","unknown":"learned"}'), { water: "learned", book: "learning", cat: "new" });
assert.throws(() => parseStatuses("broken"));
assert.throws(() => parseStatuses("[]"));
assert.deepEqual(parseStatuses(JSON.stringify({ water: "learned" })), { water: "learned" });
console.log("flashcards ok");

