// Integrity of the hand-written and generated content. Runs with `npm test`.
import { readFileSync } from 'node:fs';

type Item = Record<string, unknown> & { id: string; lesson?: number };
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

  // Words with harder kanji are written in kana, with the full form kept in `kanji`.
  it('writes vocab only with N5 kanji', () => {
    const n5 = new Set(kanji.map((k) => k.char));
    const bad = vocab.filter((v) => [...(v.word as string).matchAll(/[一-鿿]/g)].some(([c]) => !n5.has(c)));
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
