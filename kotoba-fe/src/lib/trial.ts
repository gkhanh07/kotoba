// Phase 41i (AC-18): the guest page's 3-question trial and Hán Việt examples, built from real N5 data.
import type { Vocab } from "./flashcards";
import type { Kanji } from "./library";
import { choicesFor } from "./srs";

export type TrialQuestion = { kind: "reading" | "hv"; front: string; answer: string; choices: { id: string; label: string; ja?: boolean }[] };

const hvOf = (k: Kanji) => k.hv[0].toUpperCase();

// Reading of an N5 word → Hán Việt of one of its kanji → the first question again (recall after a gap).
export function guestTrial(vocab: Vocab[], kanji: Kanji[], rand = Math.random): TrialQuestion[] {
  const words = vocab.filter((v) => v.level === 5 && v.word !== v.reading);
  const chars = kanji.filter((k) => k.level === 5 && k.hv.length > 0);
  const word = words[0];
  const char = chars.find((k) => word?.word.includes(k.char)) ?? chars[0];
  if (!word || !char) return [];
  const pick = (answer: { id: string; romaji: string }, pool: { id: string; romaji: string }[]) =>
    choicesFor(answer, pool, rand).map((c) => ({ id: c.id, label: c.romaji }));
  const reading: TrialQuestion = {
    kind: "reading",
    front: word.word,
    answer: word.id,
    choices: pick({ id: word.id, romaji: word.reading }, words.map((v) => ({ id: v.id, romaji: v.reading }))).map((c) => ({ ...c, ja: true })),
  };
  const hv: TrialQuestion = {
    kind: "hv",
    front: char.char,
    answer: char.id,
    choices: pick({ id: char.id, romaji: hvOf(char) }, chars.map((k) => ({ id: k.id, romaji: hvOf(k) }))),
  };
  return [reading, hv, reading];
}

// Two-kanji N5 words read as their Hán Việt: 学生 → HỌC SINH = "học sinh". The meaning check drops
// words read the Japanese way (今日 KIM NHẬT is "hôm nay"), which would teach the wrong lesson.
export function hvExamples(vocab: Vocab[], kanji: Kanji[], n = 3) {
  const byChar = new Map(kanji.filter((k) => k.hv.length > 0).map((k) => [k.char, k]));
  return vocab
    .filter((v) => v.level === 5 && [...v.word].length === 2 && [...v.word].every((c) => byChar.has(c)))
    .map((v) => ({ id: v.id, word: v.word, reading: v.reading, vi: v.vi, en: v.en, hv: [...v.word].map((c) => hvOf(byChar.get(c)!)) }))
    .filter((e) => e.vi.toLowerCase().includes(e.hv.join(" ").toLowerCase()))
    .slice(0, n);
}
