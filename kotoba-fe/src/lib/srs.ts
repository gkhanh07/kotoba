// Leitner spaced repetition shared by kana, vocab and kanji. Pure functions.
import { WEAK_MIN_LAPSES, MAX_LAPSES } from "@/config/srs";

export const SRS_KEY = "kotoba.srs.v1";
// Days until the next review after 1, 2, 3… correct reviews in a row.
export const INTERVALS = [1, 3, 7, 14, 30];
// Box = correct reviews in a row. Known = passed the review that came after the 30-day gap.
export const KNOWN_AT = INTERVALS.length + 1;

// due: study day YYYY-MM-DD (activity.ts dayKey), at: ms of last change, lapses: wrong answers so far (missing = 0)
export type Card = { box: number; due: string; at: number; lapses?: number };
export type Srs = Record<string, Card>;

export const addDays = (day: string, n: number): string => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
// Both keys parse as UTC midnight, so the difference is a whole number of days.
export const daysUntil = (due: string, today: string) => Math.round((Date.parse(due) - Date.parse(today)) / 864e5);

export const boxOf = (s: Srs, id: string) => s[id]?.box ?? 0;
export const isDue = (c: Card | undefined, today: string) => !!c && c.due <= today;
export const isKnown = (s: Srs, id: string) => boxOf(s, id) >= KNOWN_AT;
// Learned = answered right at least once since the last miss. Lessons and meters count these.
export const isLearned = (s: Srs, id: string) => boxOf(s, id) >= 1;
export const dueCount = (s: Srs, today: string, ids?: string[]) =>
  (ids ?? Object.keys(s)).filter((id) => isDue(s[id], today)).length;

// The first day after today when any of ids comes due, and how many come due that day.
export function nextDue(s: Srs, today: string, ids: string[]): { day: string; n: number } | null {
  const days = ids.map((id) => s[id]?.due).filter((d): d is string => !!d && d > today).sort();
  return days.length ? { day: days[0], n: days.filter((d) => d === days[0]).length } : null;
}

// A miss always drops the card to box 0, due today. A hit moves it up one box,
// but only when the card is new or due: drilling ahead of schedule does not speed it up.
export function apply(s: Srs, id: string, correct: boolean, today: string, now: number): Srs {
  const c = s[id];
  if (!correct) return { ...s, [id]: { box: 0, due: today, at: now, lapses: Math.min((c?.lapses ?? 0) + 1, MAX_LAPSES) } };
  if (c && !isDue(c, today)) return s;
  const box = (c?.box ?? 0) + 1;
  const next: Card = { box, due: addDays(today, INTERVALS[Math.min(box, INTERVALS.length) - 1]), at: now };
  if (c?.lapses !== undefined) next.lapses = c.lapses;
  return { ...s, [id]: next };
}

// Often-wrong cards, worst first: most lapses, then lowest box, then id so the order is stable.
export function weakest(s: Srs, n: number): { id: string; lapses: number; box: number }[] {
  return Object.entries(s)
    .filter(([, c]) => (c.lapses ?? 0) >= WEAK_MIN_LAPSES)
    .map(([id, c]) => ({ id, lapses: c.lapses ?? 0, box: c.box }))
    .sort((a, b) => b.lapses - a.lapses || a.box - b.box || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, n);
}

export function forget(s: Srs, prefix: string): Srs {
  return Object.fromEntries(Object.entries(s).filter(([id]) => !id.startsWith(prefix)));
}

// What to ask next: due cards first, then cards never seen, then extra practice on everything.
export type Mode = "due" | "new" | "extra";
export function queue<T extends { id: string }>(items: T[], s: Srs, today: string): { mode: Mode; items: T[] } {
  const due = items.filter((k) => isDue(s[k.id], today));
  if (due.length) return { mode: "due", items: due };
  const fresh = items.filter((k) => !s[k.id]);
  if (fresh.length) return { mode: "new", items: fresh };
  return { mode: "extra", items };
}

export function pickNext<T extends { id: string }>(items: T[], s: Srs, lastId: string | null, today: string, rand = Math.random): T | null {
  const pool = queue(items, s, today).items;
  if (!pool.length) return null;
  const fresh = pool.length > 1 ? pool.filter((k) => k.id !== lastId) : pool;
  return fresh[Math.floor(rand() * fresh.length)];
}

// Four choices: the answer plus three distractors, shuffled. Readings must differ too:
// じ and ぢ are both "ji", so offering both would make two buttons correct.
export function choicesFor<T extends { id: string; romaji?: string }>(answer: T, items: T[], rand = Math.random): T[] {
  const key = (k: T) => k.romaji ?? k.id;
  const others = items.filter((k) => key(k) !== key(answer));
  const picked: T[] = [];
  while (picked.length < 3 && others.length) {
    const k = others.splice(Math.floor(rand() * others.length), 1)[0];
    if (!picked.some((p) => key(p) === key(k))) picked.push(k);
  }
  const all = [...picked, answer];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

// Wrong shape → null, so the caller can warn instead of overwriting.
export function parseSrs(raw: string): Srs | null {
  try {
    const o = JSON.parse(raw) as Srs | null;
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const ok = Object.values(o).every((c) => c && Number.isInteger(c.box) && typeof c.due === "string" && typeof c.at === "number" && (c.lapses === undefined || (Number.isInteger(c.lapses) && c.lapses >= 0 && c.lapses <= MAX_LAPSES)));
    return ok ? o : null;
  } catch {
    return null;
  }
}

// One-time import of the pre-SRS keys. Everything lands due today so it shows up for review.
export const OLD_PROGRESS_KEY = "kotoba.progress.v1";
export const OLD_FLASHCARDS_KEY = "kotoba.flashcards.v1";
const OLD_VOCAB: Record<string, string> = {
  water: "水", book: "本", cat: "ねこ", station: "駅", rain: "雨", friend: "友だち",
  school: "学校", eat: "食べる", today: "今日", beautiful: "きれい", coffee: "コーヒー", "thank-you": "ありがとう",
};
export function migrate(progress: string | null, flashcards: string | null, today: string, now: number): Srs {
  const read = (raw: string | null): Record<string, unknown> => {
    try {
      const o: unknown = JSON.parse(raw ?? "{}");
      return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  };
  const s: Srs = {};
  for (const [id, v] of Object.entries(read(progress))) {
    const streak = (v as { streak?: unknown })?.streak;
    if (typeof streak === "number") s[id] = { box: streak >= 3 ? 2 : streak >= 1 ? 1 : 0, due: today, at: now };
  }
  for (const [old, status] of Object.entries(read(flashcards))) {
    const word = OLD_VOCAB[old];
    if (word && (status === "learned" || status === "learning")) s[`vocab:${word}`] = { box: status === "learned" ? 2 : 0, due: today, at: now };
  }
  return s;
}
