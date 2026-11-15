// Phase 40e: fill-in-the-blank questions built from a grammar point's own examples. Pure, client-safe.
import type { Grammar } from "./library";
import { choicesFor } from "./srs";

export const BLANK = "＿＿＿";
export type GrammarQuestion = Pick<Grammar, "id" | "slug" | "lesson" | "pattern" | "title"> & {
  before: string;
  after: string;
  answer: string; // the blanked part of the pattern, as written in the pattern
  translation: { vi: string; en: string };
};

const JA = /^[぀-ヿ一-鿿]+$/;

// The Japanese parts of a pattern worth blanking, longest first: "V-て ください" → ください; "〜はずだ" → はずだ, はず
// (the second so a conjugated example, はずです, still matches). Single kana (か, も, で) are too thin to ask about.
export function fragments(pattern: string): string[] {
  const tokens = pattern
    .replace(/\([^)]*[A-Za-zÀ-ỹ][^)]*\)/g, " ") // "(trông có vẻ)" glosses
    .split(/[〜～\s・/、,，+]+/)
    .map((t) => t.replace(/^[A-Za-z0-9]+-/, "")) // "V-ます" → ます
    .filter((t) => JA.test(t));
  const out = new Set<string>();
  for (const t of tokens) {
    if (t.length >= 2) out.add(t);
    if (t.length >= 3) out.add(t.slice(0, -1));
  }
  return [...out].sort((a, b) => b.length - a.length);
}

// AC-10: the first example that contains the pattern gives the question; none → null, and the point is skipped.
// Examples space their words ("に とって"), so spaces may fall between any two characters.
export function questionFor(g: Grammar): GrammarQuestion | null {
  for (const f of fragments(g.pattern)) {
    const re = new RegExp([...f].join("[\\s　]*"));
    for (const ex of g.examples) {
      const m = re.exec(ex.ja);
      if (m) return { id: g.id, slug: g.slug, lesson: g.lesson, pattern: g.pattern, title: g.title, before: ex.ja.slice(0, m.index), after: ex.ja.slice(m.index + m[0].length), answer: f, translation: { vi: ex.vi, en: ex.en } };
    }
  }
  return null;
}

export const grammarQuestions = (points: Grammar[]) => points.map(questionFor).filter((q): q is GrammarQuestion => q !== null);

// Four choices. Points of the same lesson are left out as distractors: a lesson teaches look-alikes side by side
// (間に and うちに in lesson 47), so one of them could fill the blank as well. choicesFor drops identical answers.
// ponytail: other near-synonyms across lessons can still both fit; a per-point "confusable" list if learners report it.
export const grammarChoices = (q: GrammarQuestion, all: GrammarQuestion[], rand = Math.random) =>
  choicesFor(
    { id: q.id, romaji: q.answer },
    all.filter((x) => x.id === q.id || x.lesson !== q.lesson).map((x) => ({ id: x.id, romaji: x.answer })),
    rand,
  );
