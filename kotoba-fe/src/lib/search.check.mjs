// Run: node --experimental-strip-types src/lib/search.check.mjs
import assert from "node:assert/strict";
import { mark, normalize } from "./search.ts";

assert.equal(normalize(" Đà Nẵng "), "da nang");
assert.equal(normalize("ガッコウ"), "がっこう");
assert.equal(normalize("gakkō"), "gakko");
assert.deepEqual(mark("bàn học", "hoc"), ["bàn ", "học", ""]);
assert.deepEqual(mark("Nhật Bản", "nhat"), ["", "Nhật", " Bản"]);
assert.deepEqual(mark("ガッコウ", "がっこう"), ["", "ガッコウ", ""]);
assert.deepEqual(mark("ひと.つ", "ひとつ"), ["", "ひと.つ", ""]); // KANJIDIC okurigana dot stays inside the mark
assert.deepEqual(mark("が", "が"), ["", "が", ""]); // dakuten is not a Latin mark
assert.deepEqual(mark("食べる", "xyz"), ["食べる"]);
assert.deepEqual(mark("食べる", "  "), ["食べる"]);
