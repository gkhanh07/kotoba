import { normalize, searchText } from './content.js';

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
