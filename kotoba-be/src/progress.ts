// Merging a browser's study progress into the account. Pure: progress.spec.ts tests it directly.
// Shapes match kotoba-fe/src/lib/srs.ts (Card) and kotoba-fe/src/lib/activity.ts (Activity).

export type Card = { box: number; due: string; at: number };
export type Cards = Record<string, Card>;
export const AREAS = ['kana', 'vocab'] as const;
export type Day = { minutes: number[]; kana: string[]; vocab: string[] };
export type Activity = { days: Record<string, Day>; last?: { area: string; ref: string } };
export type Forget = { prefix: string; at: number };

export const KEEP_DAYS = 90;
const MAX_IDS = 2000; // per day and area; keeps a junk push from bloating the stored log
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const isIds = (v: unknown) =>
  Array.isArray(v) && v.length <= MAX_IDS && v.every((x) => typeof x === 'string' && x.length <= 64);

export const isCard = (v: unknown): v is Card =>
  isObject(v) && Number.isInteger(v.box) && (v.box as number) >= 0 && (v.box as number) <= 100 &&
  typeof v.due === 'string' && DAY.test(v.due) && isTime(v.at);
export const isCards = (v: unknown): v is Cards => isObject(v) && Object.values(v).every(isCard);

const isDay = (v: unknown) =>
  isObject(v) && Array.isArray(v.minutes) && v.minutes.length <= 1440 &&
  v.minutes.every((m) => Number.isInteger(m) && m >= 0 && m < 1440) && AREAS.every((a) => isIds(v[a]));
export const isActivity = (v: unknown): v is Activity =>
  isObject(v) && isObject(v.days) && Object.keys(v.days).length <= KEEP_DAYS * 2 &&
  Object.entries(v.days).every(([k, d]) => DAY.test(k) && isDay(d)) &&
  (v.last === undefined || (isObject(v.last) && AREAS.includes(v.last.area as never) && typeof v.last.ref === 'string'));
// "hiragana:" and the like; never "" (that would forget everything).
export const isForget = (v: unknown): v is Forget => isObject(v) && typeof v.prefix === 'string' && /^[a-z]+:$/.test(v.prefix) && isTime(v.at);

// The pushed cards worth writing: known items only, and only where the push is newer. Ties keep the server copy.
// ponytail: "newer" trusts the browsers' clocks; a device with a clock far ahead wins every conflict.
export function newer(server: Cards, pushed: Cards, known: Set<string>): Cards {
  return Object.fromEntries(Object.entries(pushed).filter(([id, c]) => known.has(id) && !(server[id]?.at >= c.at)));
}

const union = <T>(a: T[], b: T[]) => [...new Set([...a, ...b])].slice(0, MAX_IDS);

// Days are unioned field by field and trimmed to the newest KEEP_DAYS; the pushed "last" wins.
export function mergeActivity(stored: Activity, pushed: Activity): Activity {
  const days: Record<string, Day> = { ...stored.days };
  for (const [k, d] of Object.entries(pushed.days)) {
    const s = days[k] ?? { minutes: [], kana: [], vocab: [] };
    days[k] = { minutes: union(s.minutes, d.minutes), kana: union(s.kana, d.kana), vocab: union(s.vocab, d.vocab) };
  }
  const keep = Object.keys(days).sort().slice(-KEEP_DAYS);
  return { days: Object.fromEntries(keep.map((k) => [k, days[k]])), last: pushed.last ?? stored.last };
}

export function parseActivity(raw: string): Activity {
  try {
    const o: unknown = JSON.parse(raw);
    return isActivity(o) ? o : { days: {} };
  } catch {
    return { days: {} };
  }
}
