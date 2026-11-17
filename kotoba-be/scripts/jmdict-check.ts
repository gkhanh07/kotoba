// Gate for hand-written vocab: every (word, reading) must be a JMdict entry, every example must use the word.
// Run: node scripts/jmdict-check.ts   Exits 1 on any failure. Delete .cache/ to refetch JMdict.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const URL = 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz';
const CACHE = '.cache/JMdict_e.gz';

if (!existsSync(CACHE)) {
  mkdirSync('.cache', { recursive: true });
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`${URL}: ${res.status}`);
  writeFileSync(CACHE, Buffer.from(await res.arrayBuffer()));
}

// spelling -> readings it has in any entry.
// ponytail: ignores re_restr, so a reading tied to another spelling of the same entry still passes.
const readings = new Map<string, Set<string>>();
for (const e of gunzipSync(readFileSync(CACHE)).toString().split('<entry>').slice(1)) {
  const rebs = [...e.matchAll(/<reb>(.+?)<\/reb>/g)].map((m) => m[1]);
  for (const s of [...[...e.matchAll(/<keb>(.+?)<\/keb>/g)].map((m) => m[1]), ...rebs]) {
    const set = readings.get(s) ?? new Set();
    rebs.forEach((r) => set.add(r));
    readings.set(s, set);
  }
}

type Vocab = { id: string; word: string; kanji?: string; reading: string; example: { ja: string } };
const vocab = JSON.parse(readFileSync(process.argv[2] ?? 'content/vocab.json', 'utf8')) as Vocab[];

// Conjugation changes the tail (食べる -> 食べます, 行く -> 行きます), so a kana-final word only needs its stem.
const stem = (w: string) => (w.length > 1 && /[ぁ-ん]$/.test(w) ? w.slice(0, -1) : w);

const bad: string[] = [];
for (const v of vocab) {
  for (const w of [v.word, v.kanji].filter((x) => x !== undefined)) {
    if (!readings.get(w)?.has(v.reading)) bad.push(`${v.id}: ${w}【${v.reading}】 not in JMdict`);
  }
  if (!v.example.ja.includes(stem(v.word))) bad.push(`${v.id}: example does not use ${v.word}`);
}

console.log(`${vocab.length} words checked against ${readings.size} JMdict spellings`);
if (bad.length) {
  console.error(bad.join('\n'));
  process.exit(1);
}
