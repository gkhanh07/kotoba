// Builds content/kanji.json from KANJIDIC2 (old JLPT level 4 = N5). Run: node scripts/kanjidic.ts
// Keeps the hand-written fields (vi, lesson, reviewed, similar) already in kanji.json. Delete .cache/ to refetch.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const URL = 'http://www.edrdg.org/kanjidic/kanjidic2.xml.gz';
const CACHE = '.cache/kanjidic2.xml.gz';
const OUT = 'content/kanji.json';
// Characters outside KANJIDIC's level 4 that N5 lessons still teach.
const EXTRA: string[] = [];

if (!existsSync(CACHE)) {
  mkdirSync('.cache', { recursive: true });
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`${URL}: ${res.status}`);
  writeFileSync(CACHE, Buffer.from(await res.arrayBuffer()));
}

const xml = gunzipSync(readFileSync(CACHE)).toString();
const all = (s: string, re: RegExp) => [...s.matchAll(re)].map((m) => m[1]);
const one = (s: string, re: RegExp) => s.match(re)?.[1];

type Authored = { vi?: string; lesson?: number | null; reviewed?: boolean; similar?: string[] };
const old = new Map<string, Authored>(
  existsSync(OUT) ? (JSON.parse(readFileSync(OUT, 'utf8')) as ({ char: string } & Authored)[]).map((k) => [k.char, k]) : [],
);

const kanji = xml
  .split('<character>')
  .slice(1)
  .filter((c) => c.includes('<jlpt>4</jlpt>') || EXTRA.includes(one(c, /<literal>(.+?)<\/literal>/)!))
  .map((c) => {
    const char = one(c, /<literal>(.+?)<\/literal>/)!;
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
      reviewed: a.reviewed ?? false,
      // Look-alike kanji, authored by hand (phase 19); only set on the kanji that have some.
      ...(a.similar ? { similar: a.similar } : {}),
    };
  })
  // Most frequent first: the order lessons and lists use.
  .sort((x, y) => x.freq - y.freq || x.char.localeCompare(y.char));

writeFileSync(OUT, JSON.stringify(kanji, null, 1) + '\n');
console.log(`${OUT}: ${kanji.length} kanji, ${kanji.filter((k) => !k.vi).length} without vi`);
