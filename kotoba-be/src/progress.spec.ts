import { cardsOf, isActivity, isCard, isCards, isForget, isTestScores, MAX_PUSH_TESTS, mergeActivity, newer, testsOf } from './progress.js';

const card = (box: number, at: number) => ({ box, due: '2026-11-02', at });

describe('newer', () => {
  it('keeps pushed cards that are newer or new, on known items only', () => {
    const server = { a: card(1, 100), b: card(2, 100) };
    const pushed = { a: card(3, 200), b: card(0, 50), c: card(1, 10), x: card(1, 999) };
    expect(newer(server, pushed, new Set(['a', 'b', 'c']))).toEqual({ a: card(3, 200), c: card(1, 10) });
  });

  it('lets the server copy win a tie', () => {
    expect(newer({ a: card(1, 100) }, { a: card(5, 100) }, new Set(['a']))).toEqual({});
  });
});

describe('mergeActivity', () => {
  it('unions days field by field and lets the pushed last win', () => {
    const stored = { days: { '2026-11-01': { minutes: [1, 2], kana: ['hiragana:a'], vocab: [] } }, last: { area: 'kana', ref: 'hiragana:a' } };
    const pushed = {
      days: {
        '2026-11-01': { minutes: [2, 3], kana: ['hiragana:i'], vocab: ['vocab:水'], kanji: ['kanji:日'] },
        '2026-11-02': { minutes: [5], kana: [], vocab: [] },
      },
      last: { area: 'vocab', ref: 'vocab:水' },
    };
    expect(mergeActivity(stored, pushed)).toEqual({
      days: {
        '2026-11-01': { minutes: [1, 2, 3], kana: ['hiragana:a', 'hiragana:i'], vocab: ['vocab:水'], kanji: ['kanji:日'] },
        '2026-11-02': { minutes: [5], kana: [], vocab: [], kanji: [] },
      },
      last: { area: 'vocab', ref: 'vocab:水' },
    });
    expect(mergeActivity(stored, { days: {} }).last).toEqual(stored.last);
  });

  it('keeps only the newest 90 days', () => {
    const day = (i: number) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    const days = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [day(i), { minutes: [], kana: [], vocab: [] }]));
    const kept = Object.keys(mergeActivity({ days: {} }, { days }).days);
    expect(kept).toHaveLength(90);
    expect(kept[0]).toBe(day(10));
  });
});

describe('validation', () => {
  it('rejects bad cards, activity and resets', () => {
    expect(isCards({ a: card(1, 1) })).toBe(true);
    expect(isCards({ a: { box: -1, due: '2026-11-02', at: 1 } })).toBe(false);
    expect(isCards({ a: { box: 1, due: 'tomorrow', at: 1 } })).toBe(false);
    expect(isCards([])).toBe(false);
    expect(isActivity({ days: { '2026-11-02': { minutes: [1440], kana: [], vocab: [] } } })).toBe(false);
    expect(isActivity({ days: { bad: { minutes: [], kana: [], vocab: [] } } })).toBe(false);
    expect(isActivity({ days: {}, last: { area: 'music', ref: 'x' } })).toBe(false);
    expect(isActivity({ days: { '2026-11-02': { minutes: [], kana: [], vocab: [] } }, last: { area: 'kanji', ref: 'kanji:日' } })).toBe(true);
    expect(isActivity({ days: { '2026-11-02': { minutes: [], kana: [], vocab: [], kanji: [1] } } })).toBe(false);
    expect(isForget({ prefix: 'hiragana:', at: 1 })).toBe(true);
    expect(isForget({ prefix: '', at: 1 })).toBe(false);
    expect(isForget({ prefix: '%', at: 1 })).toBe(false);
  });
});

describe('isCard lapses', () => {
  const withLapses = (lapses: unknown) => ({ ...card(1, 1), lapses });
  it('accepts a card without lapses (old clients)', () => {
    expect(isCard(card(1, 1))).toBe(true);
  });
  it.each([0, 1, 2, 10000])('accepts lapses %s', (n) => {
    expect(isCard(withLapses(n))).toBe(true);
  });
  it.each([
    ['negative', -1],
    ['a fraction', 1.5],
    ['a numeric string', '2'],
    ['above the maximum', 10001],
    ['null', null],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['a boolean', true],
  ])('rejects lapses that is %s', (_name, v) => {
    expect(isCard(withLapses(v))).toBe(false);
  });
  it('rejects a bad lapses inside isCards', () => {
    expect(isCards({ a: card(1, 1), b: withLapses(-1) })).toBe(false);
    expect(isCards({ a: withLapses(3) })).toBe(true);
  });
});

describe('cardsOf', () => {
  it('keys rows by item id and reads a null due as an empty string', () => {
    expect(cardsOf([
      { itemId: 'kanji:日', box: 2, due: '2026-11-05', at: 9, lapses: 1, saved: false },
      { itemId: 'hiragana:a', box: 0, due: null, at: 3, lapses: 0, saved: false },
    ])).toEqual({ 'kanji:日': { box: 2, due: '2026-11-05', at: 9, lapses: 1 }, 'hiragana:a': { box: 0, due: '', at: 3, lapses: 0 } });
  });
});

// Phase 40a: saved is optional; the API only ever answers saved: true.
describe('saved', () => {
  it('isCard accepts a card without saved and a boolean saved, and rejects anything else', () => {
    expect(isCard(card(1, 1))).toBe(true);
    expect(isCard({ ...card(1, 1), saved: true })).toBe(true);
    expect(isCard({ ...card(1, 1), saved: false })).toBe(true);
    for (const saved of ['true', 1, null]) expect(isCard({ ...card(1, 1), saved })).toBe(false);
  });
  it('cardsOf adds saved: true only for a saved row', () => {
    expect(cardsOf([
      { itemId: 'a', box: 0, due: null, at: 1, lapses: 0, saved: true },
      { itemId: 'b', box: 0, due: null, at: 1, lapses: 0, saved: false },
    ])).toEqual({ a: { box: 0, due: '', at: 1, lapses: 0, saved: true }, b: { box: 0, due: '', at: 1, lapses: 0 } });
  });
});

describe('test scores (phase 40g)', () => {
  const t = (over: object = {}) => ({ testId: 'n5-1', score: 30, total: 41, at: 1000, ...over });
  it('accepts a list of scores and rejects bad ones', () => {
    expect(isTestScores([])).toBe(true);
    expect(isTestScores([t(), t({ testId: 'n4-2', score: 0 })])).toBe(true);
    expect(isTestScores({})).toBe(false);
    for (const bad of [{ testId: '' }, { testId: 'N5 1' }, { testId: 'x'.repeat(65) }, { score: -1 }, { score: 42 }, { score: 1.5 },
      { total: 0 }, { total: 501 }, { at: 0 }, { at: 'now' }]) expect(isTestScores([t(bad)])).toBe(false);
    expect(isTestScores(Array.from({ length: MAX_PUSH_TESTS + 1 }, (_, i) => t({ at: i + 1 })))).toBe(false);
  });

  it('testsOf answers only the public fields, newest first', () => {
    const rows = [{ id: 1, userId: 'u', testId: 'n5-1', score: 3, total: 4, at: 10 }, { id: 2, userId: 'u', testId: 'n5-2', score: 1, total: 4, at: 20 }];
    expect(testsOf(rows)).toEqual([{ testId: 'n5-2', score: 1, total: 4, at: 20 }, { testId: 'n5-1', score: 3, total: 4, at: 10 }]);
  });
});
