// Builds content/strokes.json from KanjiVG r20250816. Run: node scripts/kanjivg.ts
// Paths use viewBox="0 0 109 109" without scaling; keep the source and share-alike licence with the data.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const URL = 'https://github.com/KanjiVG/kanjivg/releases/download/r20250816/kanjivg-20250816.xml.gz';
const CACHE = '.cache/kanjivg.xml.gz';
const OUT = 'content/strokes.json';
const SOURCE = 'KanjiVG r20250816 (https://kanjivg.tagaini.net), Ulrich Apel';
const LICENSE = 'CC BY-SA 3.0';

if (!existsSync(CACHE)) {
  mkdirSync('.cache', { recursive: true });
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`${URL}: ${res.status}`);
  writeFileSync(CACHE, Buffer.from(await res.arrayBuffer()));
}

const input: unknown = JSON.parse(readFileSync('content/kanji.json', 'utf8'));
if (!Array.isArray(input)) throw new Error('kanji.json must contain an array');
const kanji = input.map((entry: unknown) => {
  if (
    typeof entry !== 'object' || entry === null ||
    !('char' in entry) || typeof entry.char !== 'string' || [...entry.char].length !== 1 ||
    !('strokes' in entry) || typeof entry.strokes !== 'number' ||
    !Number.isInteger(entry.strokes) || entry.strokes <= 0
  ) throw new Error('Invalid kanji.json entry: expected a character and positive stroke count');
  return { char: entry.char, strokes: entry.strokes };
});
if (new Set(kanji.map((entry) => entry.char)).size !== kanji.length) {
  throw new Error('Duplicate characters in kanji.json');
}

const xml = gunzipSync(readFileSync(CACHE)).toString('utf8');
const wanted = new Set(kanji.map((entry) => entry.char));
const pathsByChar = new Map<string, string[]>();
// Match only the base entry: variant suffixes such as -Kaisho must not supply or replace strokes.
for (const entry of xml.matchAll(/<kanji\s+id="kvg:kanji_([0-9a-f]+)"\s*>([\s\S]*?)<\/kanji>/g)) {
  const char = String.fromCodePoint(Number.parseInt(entry[1], 16));
  if (!wanted.has(char)) continue;
  if (pathsByChar.has(char)) throw new Error(`Duplicate base entry for ${char}`);
  const strokes: { number: number; d: string }[] = [];
  for (const path of entry[2].matchAll(/<path\b([^>]*?)\/?\s*>/g)) {
    const id = path[1].match(/\bid="([^"]+)"/)?.[1];
    const stroke = id?.match(/^kvg:([0-9a-f]+)-s([1-9]\d*)$/);
    const d = path[1].match(/\bd="([^"]+)"/)?.[1];
    if (!stroke || stroke[1] !== entry[1] || !d) {
      throw new Error(`Invalid stroke path for ${char}: ${id ?? 'missing id'}`);
    }
    strokes.push({ number: Number(stroke[2]), d });
  }
  strokes.sort((a, b) => a.number - b.number);
  if (!strokes.length || strokes.some((stroke, index) => stroke.number !== index + 1)) {
    throw new Error(`Missing or duplicate stroke numbers for ${char}`);
  }
  pathsByChar.set(char, strokes.map((stroke) => stroke.d));
}

const lines = kanji.map(({ char, strokes }) => {
  const paths = pathsByChar.get(char);
  if (!paths) throw new Error(`Missing KanjiVG base entry for ${char}`);
  if (paths.length !== strokes) {
    console.warn(`${char}: KanjiVG ${paths.length} strokes, kanji.json ${strokes}`);
  }
  return `${JSON.stringify(char)}:${JSON.stringify(paths)}`;
});
// Validate everything before writing, so incomplete input cannot replace an existing dataset.
const output = `{"source":${JSON.stringify(SOURCE)},"license":${JSON.stringify(LICENSE)},"items":{\n${lines.join(',\n')}\n}}\n`;
writeFileSync(OUT, output);
console.info(`${OUT}: ${kanji.length} kanji, ${Buffer.byteLength(output)} bytes`);
