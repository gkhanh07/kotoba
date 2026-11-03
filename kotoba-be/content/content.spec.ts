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
    // Phase 24a: N4 vocab lessons 26–32 (docs/phases/24-n4-vocab.md).
    expect([count(vocab, 5), count(vocab, 4)]).toEqual([694, 178]);
    expect(vocab).toHaveLength(872);
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
              (['kanji', 'writing', 'paraphrase'].includes(part) && !/\{.+\}/.test(q)) ||
              (part === 'order' && !q.includes('★')),
          )
          .map(({ q }) => `${p.id} ${part}: ${q}`),
      ),
    );
    expect(bad).toEqual([]);
  });

  it('reports what still needs a human review', () => {
    const todo = all.filter((d) => d.reviewed === false).length;
    console.log(`content: ${all.length} items, ${todo} reviewed:false`);
    expect(todo).toBeGreaterThanOrEqual(0);
  });
});
