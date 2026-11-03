import { normalize, paginate, searchText } from './content.js';
import { isLevel, isPage } from './validate.js';

describe('normalize', () => {
  it('folds Vietnamese, kana and macrons to one form', () => {
    expect(normalize('Nhật')).toBe('nhat');
    expect(normalize('Đường')).toBe('duong');
    expect(normalize('ガッコウ')).toBe('がっこう');
    expect(normalize('が')).toBe('が');
    expect(normalize('gakkō')).toBe('gakko');
    expect(normalize(' ひと.つ ')).toBe('ひとつ');
  });

  it('builds search text from the matchable fields only', () => {
    const t = searchText({ char: '日', hv: ['Nhật'], kun: ['ひ', '-か'], title: { vi: 'Học' }, hint: 'ca' });
    expect(t.split('\n')).toEqual(['日', 'nhat', 'ひ', 'か', 'hoc']);
  });
});

describe('paginate', () => {
  const list = (n: number) => Array.from({ length: n }, (_, i) => i);

  it('cuts a full first page and puts the remainder on the last', () => {
    expect(paginate(list(250), 1, 100)).toEqual({ items: list(100), page: 1, pages: 3, total: 250 });
    expect(paginate(list(250), 3, 100)).toEqual({ items: list(250).slice(200), page: 3, pages: 3, total: 250 });
  });

  it('fits exactly one page at the page size and opens a second at size + 1', () => {
    expect(paginate(list(100), 1, 100).pages).toBe(1);
    expect(paginate(list(101), 2, 100)).toEqual({ items: [100], page: 2, pages: 2, total: 101 });
  });

  it('answers a page past the end with no items and the same page count', () => {
    expect(paginate(list(250), 4, 100)).toEqual({ items: [], page: 4, pages: 3, total: 250 });
  });

  // Page 1 always exists, so an empty level is an empty page rather than a page past the end.
  it('has one empty page when there is nothing', () => {
    expect(paginate([], 1, 100)).toEqual({ items: [], page: 1, pages: 1, total: 0 });
  });
});

describe('level and page guards', () => {
  it('accepts the four JLPT levels only', () => {
    expect([5, 4, 3, 2].every(isLevel)).toBe(true);
    expect([1, 6, 0, 4.5, NaN, '5', undefined].some(isLevel)).toBe(false);
  });

  it('accepts whole pages from 1', () => {
    expect([1, 2, 1000].every(isPage)).toBe(true);
    expect([0, -1, 1.5, NaN, Infinity, '1', 2 ** 53].some(isPage)).toBe(false);
  });
});
