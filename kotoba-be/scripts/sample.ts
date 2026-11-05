// Draws the review sample of AGENTS.md §12: the same seed always gives the same items.
// Reads the content and writes only the review sheet: `reviewed` stays the user's to set.
// Usage: node scripts/sample.ts <seed> [out.md]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SAMPLE_SIZE = 30;
const MAX_WRONG_RATE = 0.05;

type Example = { ja: string; vi: string };
type Word = { id: string; word: string; reading: string; kanji?: string; vi: string; example: Example; level: number };
type Kanji = { id: string; char: string; hv: string[]; on: string[]; kun: string[]; vi: string; level: number };
type Grammar = { id: string; pattern: string; title: { vi: string }; structure: string; explain: { vi: string }; examples: Example[]; note?: { vi: string }; level: number };
type Question = { q: string; choices: string[]; answer: number; explain: string };
type Paper = { id: string; level: number; parts: { part: string; passage?: string; questions: Question[] }[] };
type Placed = Question & { ref: string; passage?: string };

const load = <T>(name: string) => JSON.parse(readFileSync(resolve(import.meta.dirname, `../content/${name}.json`), 'utf8')) as T[];

// mulberry32: small and stable, so a seed in a report can be replayed on any Node version.
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

// Fisher-Yates, cut to the sample size.
function draw<T>(items: T[], random: () => number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, SAMPLE_SIZE);
}

const wordLine = (w: Word) => {
  const written = w.kanji ? `${w.word} (${w.kanji})` : w.word;
  return `- [ ] \`${w.id}\` **${written}** 【${w.reading}】: ${w.vi}\n  - Ví dụ: ${w.example.ja} → ${w.example.vi}`;
};
const kanjiLine = (k: Kanji) => `- [ ] \`${k.id}\` **${k.char}** Hán Việt: ${k.hv.join(', ') || '-'}; on: ${k.on.join('、') || '-'}; kun: ${k.kun.join('、') || '-'}; nghĩa: ${k.vi}`;
const grammarLine = (g: Grammar) => {
  const examples = g.examples.map((e) => `\n  - Ví dụ: ${e.ja} → ${e.vi}`).join('');
  const note = g.note ? `\n  - Lưu ý: ${g.note.vi}` : '';
  return `- [ ] \`${g.id}\` **${g.pattern}**: ${g.title.vi}\n  - Cấu trúc: ${g.structure}\n  - Giải thích: ${g.explain.vi}${examples}${note}`;
};
const questionLine = (q: Placed) => {
  const passage = q.passage ? `\n  - Bài đọc: ${q.passage.replace(/\s*\n\s*/g, ' ')}` : '';
  const choices = q.choices.map((c, i) => (i === q.answer ? `**${c}** ✓` : c)).join(' / ');
  return `- [ ] \`${q.ref}\`${passage}\n  - Câu hỏi: ${q.q}\n  - Lựa chọn: ${choices}\n  - Giải thích: ${q.explain}`;
};

const questionsOf = (paper: Paper): Placed[] =>
  paper.parts.flatMap((part, p) => part.questions.map((q, i) => ({ ...q, ref: `${paper.id}#${p + 1}.${i + 1}-${part.part}`, passage: part.passage })));

const section = <T>(title: string, items: T[], line: (item: T) => string, random: () => number) => {
  const sample = draw(items, random);
  return `## ${title} (${sample.length} / ${items.length} mục)\n\n${sample.map(line).join('\n')}\n`;
};

const seedArg = process.argv[2];
const out = process.argv[3];
const seed = Number(seedArg);
if (!seedArg || !Number.isSafeInteger(seed)) throw new Error('Usage: node scripts/sample.ts <seed> [out.md]');

const random = seeded(seed);
const vocab = load<Word>('vocab'), kanji = load<Kanji>('kanji'), grammar = load<Grammar>('grammar'), papers = load<Paper>('tests');
const atLevel = <T extends { level: number }>(items: T[], level: number) => items.filter((d) => d.level === level);
const paperAt = (level: number) => papers.filter((p) => p.level === level).flatMap(questionsOf);

// The order is part of the seed's meaning: a new section goes last, or old samples no longer replay.
const sections = [
  section('Từ vựng N5', atLevel(vocab, 5), wordLine, random),
  section('Kanji N5', atLevel(kanji, 5), kanjiLine, random),
  section('Ngữ pháp N5', atLevel(grammar, 5), grammarLine, random),
  section('Câu hỏi đề N5', paperAt(5), questionLine, random),
  section('Từ vựng N4', atLevel(vocab, 4), wordLine, random),
  section('Kanji N4', atLevel(kanji, 4), kanjiLine, random),
  section('Ngữ pháp N4', atLevel(grammar, 4), grammarLine, random),
  section('Câu hỏi đề N4', paperAt(4), questionLine, random),
  section('Kanji N3', atLevel(kanji, 3), kanjiLine, random),
];

const header = `# Duyệt mẫu nội dung

Seed: ${seed}. Chạy lại trong \`kotoba-be\`: \`node scripts/sample.ts ${seed}\`.

Đánh dấu \`[x]\` mục đúng; mục sai thì ghi lỗi ngay dưới mục đó. Loại nào sai quá ${MAX_WRONG_RATE * 100}% (từ ${Math.floor(SAMPLE_SIZE * MAX_WRONG_RATE) + 1} mục sai trên ${SAMPLE_SIZE}) thì sửa loại đó và rút mẫu mới (AGENTS.md §12).

Với câu hỏi đề: \`{...}\` là phần được gạch chân trên đề, \`★\` là ô đáp án, \`✓\` là đáp án đúng.
`;
const sheet = [header, ...sections].join('\n');
if (out) writeFileSync(out, sheet);
else process.stdout.write(sheet);
