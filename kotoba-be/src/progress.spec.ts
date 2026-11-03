import { isActivity, isCards, isForget, mergeActivity, newer } from './progress.js';

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
