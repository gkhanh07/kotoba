// Study log kept in the browser until kotoba-be exists. Pure functions + a tiny storage wrapper, like progress.ts.
// No runtime imports: activity.check.mjs loads it directly.

export const ACTIVITY_KEY = "kotoba.activity.v1";
export const AREAS = ["kana", "vocab", "kanji"] as const;
export type Area = (typeof AREAS)[number];
// One local day: distinct minute-of-day buckets (0–1439) with any study action, and distinct item ids touched.
// kanji came later, so days stored before it have no kanji list.
export type Day = { minutes: number[]; kana: string[]; vocab: string[]; kanji?: string[] };
export type Activity = { days: Record<string, Day>; last?: { area: Area; ref: string } };
export const KEEP_DAYS = 90;

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const shift = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

// Whole local calendar days, to − from. Math.round absorbs DST hour shifts.
export const daysBetween = (from: Date, to: Date): number =>
  Math.round((midnight(to).getTime() - midnight(from).getTime()) / 86_400_000);

// ponytail: minutes = distinct minutes with an answer or flip, a lower bound. Real session timing when the API exists.
export function record(a: Activity, area: Area, ref: string, now: Date): Activity {
  const key = dayKey(now);
  const prev = a.days[key] ?? { minutes: [], kana: [], vocab: [] };
  const minute = now.getHours() * 60 + now.getMinutes();
  const day: Day = {
    ...prev,
    minutes: prev.minutes.includes(minute) ? prev.minutes : [...prev.minutes, minute],
    [area]: prev[area]?.includes(ref) ? prev[area] : [...(prev[area] ?? []), ref],
  };
  const oldest = dayKey(shift(now, -KEEP_DAYS));
  const days = Object.fromEntries(Object.entries({ ...a.days, [key]: day }).filter(([k]) => k >= oldest));
  return { days, last: { area, ref } };
}

const strings = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === "string");
const isDay = (v: unknown) => {
  const d = v as Day | null;
  return !!d && Array.isArray(d.minutes) && d.minutes.every(Number.isInteger) && strings(d.kana) && strings(d.vocab) && (d.kanji === undefined || strings(d.kanji));
};

// Missing key → empty log. Unreadable or wrong shape → null, so the caller can warn.
export function parseActivity(raw: string | null): Activity | null {
  if (raw === null) return { days: {} };
  try {
    const o = JSON.parse(raw) as Activity | null;
    if (!o || typeof o !== "object" || !o.days || typeof o.days !== "object" || Array.isArray(o.days)) return null;
    if (!Object.values(o.days).every(isDay)) return null;
    const l = o.last;
    if (l !== undefined && !(l && (AREAS as readonly unknown[]).includes(l.area) && typeof l.ref === "string")) return null;
    return o;
  } catch {
    return null;
  }
}

// Corrupt log → start fresh; storage blocked → skip silently (the dashboard shows the warning).
export function logActivity(area: Area, ref: string): void {
  try {
    const a = parseActivity(localStorage.getItem(ACTIVITY_KEY)) ?? { days: {} };
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(record(a, area, ref, new Date())));
  } catch {}
}

export type Summary = {
  streak: number;
  minutesToday: number;
  today: Record<Area, number>;
  recent: ({ day: string; minutes: number } & Record<Area, number>)[];
  last: Activity["last"];
};

export function summarize(a: Activity, now: Date): Summary {
  // A streak stays alive until today ends, so count from yesterday if today has nothing yet.
  let d = a.days[dayKey(now)] ? midnight(now) : shift(now, -1);
  let streak = 0;
  while (a.days[dayKey(d)]) {
    streak++;
    d = shift(d, -1);
  }
  const t = a.days[dayKey(now)];
  const recent = Object.keys(a.days)
    .sort()
    .reverse()
    .slice(0, 7)
    .map((day) => ({ day, minutes: a.days[day].minutes.length, kana: a.days[day].kana.length, vocab: a.days[day].vocab.length, kanji: a.days[day].kanji?.length ?? 0 }));
  return {
    streak,
    minutesToday: t?.minutes.length ?? 0,
    today: { kana: t?.kana.length ?? 0, vocab: t?.vocab.length ?? 0, kanji: t?.kanji?.length ?? 0 },
    recent,
    last: a.last,
  };
}

export function continueHref(last: Activity["last"]): string {
  if (last?.area === "vocab") return "/flashcards";
  if (last?.area === "kanji") return "/review?kind=kanji";
  return `/kana?script=${last?.ref.startsWith("katakana:") ? "katakana" : "hiragana"}&mode=quiz`;
}
