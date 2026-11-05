// Builds content/kanji.json from KANJIDIC2. Run: node scripts/kanjidic.ts
// Keeps the hand-written fields (vi, lesson, reviewed, similar) already in kanji.json. Delete .cache/ to refetch.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const URL = 'http://www.edrdg.org/kanjidic/kanjidic2.xml.gz';
const CACHE = '.cache/kanjidic2.xml.gz';
const OUT = 'content/kanji.json';
const LEVELS = 'scripts/levels.txt';
// KANJIDIC2 has the four pre-2010 JLPT levels. Old 4 = N5, old 3 = N4. Old 2 is N3 and N2 merged, so those
// come from Waller's lists in levels.txt, after the old mapping: a kanji already taught at N5/N4 keeps it (ADR 006).
const OLD_TO_NEW: Record<string, number> = { 4: 5, 3: 4 };
// New levels written to kanji.json; a level is added here when its content is authored.
const INCLUDE_LEVELS = [5, 4, 3];
// Characters KANJIDIC2 gives no included level that lessons still teach, with the level they are taught at.
const EXTRA: Record<string, number> = {};

if (!existsSync(CACHE)) {
  mkdirSync('.cache', { recursive: true });
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`${URL}: ${res.status}`);
  writeFileSync(CACHE, Buffer.from(await res.arrayBuffer()));
}

// "3 政議民…": a level, a space, then its kanji. Lines starting with # are the source credit.
const listed = new Map(
  readFileSync(LEVELS, 'utf8')
    .split('\n')
    .filter((line) => /^\d /.test(line))
    .flatMap((line) => [...line.slice(2).trim()].map((char) => [char, Number(line[0])] as const)),
);

const xml = gunzipSync(readFileSync(CACHE)).toString();
// The file is XML, so text carries entities ("coming &amp; going", BUG-011). One pass, so "&amp;lt;" stays "&lt;".
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|apos);/g, (m, e: string) => ENTITIES[e] ?? m);
const all = (s: string, re: RegExp) => [...s.matchAll(re)].map((m) => decode(m[1]));
const one = (s: string, re: RegExp) => {
  const m = s.match(re)?.[1];
  return m === undefined ? undefined : decode(m);
};

type Authored = { vi?: string; lesson?: number | null; reviewed?: boolean; similar?: string[] };
const old = new Map<string, Authored>(
  existsSync(OUT) ? (JSON.parse(readFileSync(OUT, 'utf8')) as ({ char: string } & Authored)[]).map((k) => [k.char, k]) : [],
);

const kanji = xml
  .split('<character>')
  .slice(1)
  .map((c) => {
    const char = one(c, /<literal>(.+?)<\/literal>/)!;
    const jlpt = one(c, /<jlpt>(\d)<\/jlpt>/);
    return { c, char, level: EXTRA[char] ?? (jlpt === undefined ? undefined : OLD_TO_NEW[jlpt]) ?? listed.get(char) };
  })
  .filter((k): k is typeof k & { level: number } => k.level !== undefined && INCLUDE_LEVELS.includes(k.level))
  .map(({ c, char, level }) => {
    const a = old.get(char) ?? {};
    return {
      id: `kanji:${char}`,
      char,
      hv: all(c, /<reading r_type="vietnam">(.+?)<\/reading>/g),
      on: all(c, /<reading r_type="ja_on">(.+?)<\/reading>/g),
      kun: all(c, /<reading r_type="ja_kun">(.+?)<\/reading>/g),
      en: all(c, /<meaning>(.+?)<\/meaning>/g),
      strokes: Number(one(c, /<stroke_count>(\d+)<\/stroke_count>/)),
      freq: Number(one(c, /<freq>(\d+)<\/freq>/) ?? 9999),
      vi: a.vi ?? '',
      lesson: a.lesson ?? null,
      level,
      reviewed: a.reviewed ?? false,
      // Look-alike kanji, authored by hand (phase 19); only set on the kanji that have some.
      ...(a.similar ? { similar: a.similar } : {}),
    };
  })
  // Most frequent first: the order lessons and lists use.
  .sort((x, y) => x.freq - y.freq || x.char.localeCompare(y.char));

writeFileSync(OUT, JSON.stringify(kanji, null, 1) + '\n');
console.log(`${OUT}: ${kanji.length} kanji, ${kanji.filter((k) => !k.vi).length} without vi`);
