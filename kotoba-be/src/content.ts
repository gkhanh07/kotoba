// Content kinds served from kotoba-be/content/*.json and the text search over them.
export const KINDS = { kana: 'kana', kanji: 'kanji', vocab: 'vocab', lesson: 'lessons', grammar: 'grammar' } as const;
export type Kind = keyof typeof KINDS;
export const isKind = (v: unknown): v is Kind => typeof v === 'string' && Object.hasOwn(KINDS, v);

// One form for stored text and queries: "Nhật" -> "nhat", "ガッコウ" -> "がっこう", "gakkō" -> "gakko".
// Only Latin combining marks (U+0300-036F) go, so が keeps its dakuten after NFC.
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[.-]/g, '') // KANJIDIC kun readings: "ひと.つ", "-か"
    .trim();

// Fields worth matching; kana hints are left out so "ca" finds cà phê, not か.
const FIELDS = ['char', 'word', 'kanji', 'reading', 'romaji', 'hv', 'on', 'kun', 'vi', 'en', 'title', 'pattern'];

export function searchText(d: Record<string, unknown>): string {
  const out: string[] = [];
  const add = (v: unknown) => {
    if (typeof v === 'string') out.push(normalize(v));
    else if (Array.isArray(v)) v.forEach(add);
    else if (v && typeof v === 'object') Object.values(v).forEach(add);
  };
  FIELDS.forEach((f) => add(d[f]));
  return out.join('\n');
}
