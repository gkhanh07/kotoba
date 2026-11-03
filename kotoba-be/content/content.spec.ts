// Integrity of the hand-written and generated content. Runs with `npm test`.
import { readFileSync } from 'node:fs';

type Item = Record<string, unknown> & { id: string; lesson?: number; level?: number };
const load = (f: string) => JSON.parse(readFileSync(new URL(`${f}.json`, import.meta.url), 'utf8')) as Item[];
const kana = load('kana');
const kanji = load('kanji');
const vocab = load('vocab');
const lessons = load('lessons');
const grammar = load('grammar');
const all = [...kana, ...kanji, ...vocab, ...lessons, ...grammar];

describe('content', () => {
  it('has unique ids', () => {
    const seen = new Set<string>();
    const dupes = all.filter((d) => seen.size === seen.add(d.id).size).map((d) => d.id);
    expect(dupes).toEqual([]);
  });

  it('ids follow their kind', () => {
    expect(kanji.filter((d) => d.id !== `kanji:${d.char as string}`)).toEqual([]);
    expect(vocab.filter((d) => d.id !== `vocab:${d.word as string}`)).toEqual([]);
    expect(grammar.filter((d) => d.id !== `grammar:${d.slug as string}`)).toEqual([]);
    expect(kana.filter((d) => d.id !== `${d.script as string}:${d.id.split(':')[1]}`)).toEqual([]);
  });

  it('points only at lessons that exist', () => {
    const ids = new Set(lessons.map((l) => l.lesson));
    expect(all.filter((d) => d.lesson !== undefined && !ids.has(d.lesson)).map((d) => d.id)).toEqual([]);
  });

  // Look-alike kanji (phase 19): every listed char is a kanji here, never itself, listed once, and the relation goes both ways.
  it('lists similar kanji that exist, both ways', () => {
    const byChar = new Map(kanji.map((k) => [k.char as string, k]));
    const similar = (k: Item) => (k.similar as string[] | undefined) ?? [];
    const bad = kanji.flatMap((k) => similar(k)
      .filter((c, i, a) => {
        const other = byChar.get(c);
        return c === k.char || a.indexOf(c) !== i || !other || !similar(other).includes(k.char as string);
      })
      .map((c) => `${k.char as string}→${c}`));
    expect(bad).toEqual([]);
    // N5: 11 pairs over 21 kanji (docs/phases/19-vocab-page-similar-kanji.md); N4 adds 23 pairs (docs/phases/23-n4-kanji.md).
    expect(kanji.filter((k) => similar(k).length).length).toBe(54);
    expect(kanji.reduce((n, k) => n + similar(k).length, 0)).toBe(68);
  });

  // Phase 23: the 181 N4 kanji are authored and each sits in an N4 lesson.
  // Inventory pinned to exact numbers so a dropped entry fails (AGENTS.md §7.3); update with each content phase.
  it('holds exactly the released content', () => {
    const count = (items: Item[], level: number) => items.filter((d) => d.level === level).length;
    expect(kana).toHaveLength(224);
    expect([count(kanji, 5), count(kanji, 4)]).toEqual([103, 181]);
    expect(kanji).toHaveLength(284);
    expect([count(lessons, 5), count(lessons, 4)]).toEqual([25, 20]);
    // Phase 24a/24b/24c: N4 vocab lessons 26–44 (docs/phases/24-n4-vocab.md).
    expect([count(vocab, 5), count(vocab, 4)]).toEqual([694, 578]);
    expect(vocab).toHaveLength(1272);
    // Phase 25: N4 grammar in lessons 26–44 (docs/phases/25-n4-grammar.md).
    expect([count(grammar, 5), count(grammar, 4)]).toEqual([34, 44]);
    expect(grammar).toHaveLength(78);
  });

  it('gives every N4 lesson 26–44 at least one grammar point', () => {
    const withGrammar = new Set(grammar.filter((g) => g.level === 4).map((g) => g.lesson));
    const lessonsWithout = lessons
      .filter((l) => l.level === 4 && (l.lesson as number) >= 26 && (l.lesson as number) <= 44 && !withGrammar.has(l.lesson))
      .map((l) => l.id);
    expect(lessonsWithout).toEqual([]);
  });

  it('gives every N4 kanji a meaning and an N4 lesson', () => {
    const levelOf = new Map(lessons.map((l) => [l.lesson, l.level]));
    const n4 = kanji.filter((k) => k.level === 4);
    expect(n4.length).toBe(181);
    expect(n4.filter((k) => typeof k.vi !== 'string' || k.vi.trim() === '' || levelOf.get(k.lesson) !== 4).map((k) => k.id)).toEqual([]);
  });

  // JLPT levels 5 (easiest) to 2 (phase 22). Every item and every paper names exactly one.
  const LEVELS = [5, 4, 3, 2];
  it('gives every item and paper a level', () => {
    const papers = JSON.parse(readFileSync(new URL('tests.json', import.meta.url), 'utf8')) as Item[];
    expect([...all, ...papers].filter((d) => !LEVELS.includes(d.level as number)).map((d) => d.id)).toEqual([]);
  });

  it("keeps a lesson's items at the lesson's level", () => {
    const levelOf = new Map(lessons.map((l) => [l.lesson, l.level]));
    expect(all.filter((d) => typeof d.lesson === 'number' && d.level !== levelOf.get(d.lesson)).map((d) => d.id)).toEqual([]);
  });

  // Kanji gate: a word is written only with kanji of its own level or easier (a higher number);
  // words with harder kanji are written in kana, with the full form kept in `kanji`.
  it('writes vocab only with kanji at its level or easier', () => {
    const kanjiLevel = new Map(kanji.map((k) => [k.char as string, k.level as number]));
    const bad = vocab.filter((v) =>
      [...(v.word as string).matchAll(/[一-鿿]/g)].some(([c]) => (kanjiLevel.get(c) ?? 0) < (v.level as number)),
    );
    expect(bad.map((v) => v.id)).toEqual([]);
  });

  // While there is only N5 content, the gate above means: N5 words use only N5 kanji.
  it('writes N5 vocab only with N5 kanji', () => {
    const n5 = new Set(kanji.filter((k) => k.level === 5).map((k) => k.char));
    const bad = vocab.filter((v) => v.level === 5 && [...(v.word as string).matchAll(/[一-鿿]/g)].some(([c]) => !n5.has(c)));
    expect(bad.map((v) => v.id)).toEqual([]);
  });

  // {…} marks the underlined word; ★ marks the blank asked about in sentence order.
  // Every question explains its answer in Vietnamese (AGENTS.md §12).
  it('has well-formed mock test papers', () => {
    type Q = { q: string; choices: string[]; answer: number; explain?: unknown };
    const papers = JSON.parse(readFileSync(new URL('tests.json', import.meta.url), 'utf8')) as { id: string; parts: { part: string; questions: Q[] }[] }[];
    expect(new Set(papers.map((p) => p.id)).size).toBe(papers.length);
    const bad = papers.flatMap((p) =>
      p.parts.flatMap(({ part, questions }) =>
        questions
          .filter(
            ({ q, choices, answer, explain }) =>
              typeof explain !== 'string' ||
              explain.trim() === '' ||
              new Set(choices).size !== 4 ||
              choices.length !== 4 ||
              !Number.isInteger(answer) ||
              answer < 0 ||
              answer > 3 ||
              (['kanji', 'writing', 'paraphrase', 'usage'].includes(part) && !/\{.+\}/.test(q)) ||
              (part === 'order' && !q.includes('★')),
          )
          .map(({ q }) => `${p.id} ${part}: ${q}`),
      ),
    );
    expect(bad).toEqual([]);
  });

  // Phase 26: each paper follows its level's exam blueprint: part types in exam order, questions per type,
  // number of reading passages and the clock. N5 is today's n5-1; N4 follows the jlpt.jp sample paper.
  const BLUEPRINT: Record<number, { minutes: number; parts: Record<string, number>; passages: number }> = {
    5: { minutes: 60, parts: { kanji: 8, writing: 6, context: 8, paraphrase: 4, grammar: 9, order: 4, reading: 6 }, passages: 4 },
    4: {
      minutes: 80,
      parts: { kanji: 7, writing: 5, context: 8, paraphrase: 4, usage: 4, grammar: 13, order: 4, text: 4, reading: 9 },
      passages: 6,
    },
  };
  it('builds every paper to its level blueprint', () => {
    type P = { id: string; level: number; minutes: number; parts: { part: string; passage?: string; questions: unknown[] }[] };
    const papers = JSON.parse(readFileSync(new URL('tests.json', import.meta.url), 'utf8')) as P[];
    const shape = (p: P) => {
      const parts: Record<string, number> = {};
      for (const { part, questions } of p.parts) parts[part] = (parts[part] ?? 0) + questions.length;
      return { minutes: p.minutes, parts, passages: p.parts.filter((x) => x.part === 'reading').length };
    };
    for (const p of papers) {
      const actual = shape(p);
      expect({ id: p.id, ...actual, order: Object.keys(actual.parts) }).toEqual({
        id: p.id,
        ...BLUEPRINT[p.level],
        order: Object.keys(BLUEPRINT[p.level]?.parts ?? {}),
      });
    }
    expect(papers.map((p) => p.level).sort()).toEqual([4, 5]);
  });

  // Reading and text parts carry their passage; a text passage has one numbered blank （１）… per question.
  it('gives passage parts their passage and blanks', () => {
    type P = { id: string; parts: { part: string; passage?: string; questions: { q: string }[] }[] };
    const papers = JSON.parse(readFileSync(new URL('tests.json', import.meta.url), 'utf8')) as P[];
    const bad = papers.flatMap((p) =>
      p.parts
        .filter(({ part, passage, questions }) => {
          if (part !== 'reading' && part !== 'text') return false;
          if (typeof passage !== 'string' || passage.trim() === '') return true;
          if (part !== 'text') return false;
          const blanks = [...passage.matchAll(/（[１-９]）/g)].map(([b]) => b);
          return blanks.length !== questions.length || questions.some(({ q }, i) => !q.includes(blanks[i]));
        })
        .map(({ part }) => `${p.id} ${part}`),
    );
    expect(bad).toEqual([]);
  });

  it('reports what still needs a human review', () => {
    const todo = all.filter((d) => d.reviewed === false).length;
    console.log(`content: ${all.length} items, ${todo} reviewed:false`);
    expect(todo).toBeGreaterThanOrEqual(0);
  });
});
