// Study log kept in the browser and synced to kotoba-be. Pure functions + a tiny storage wrapper.
import { HEAT_LEVELS, HEAT_WEEKS } from "@/config/activity";
import { STUDY_TIME_ZONE } from "@/config/time";
import { keepBroken } from "./broken";
import { addDays } from "./srs";

export const ACTIVITY_KEY = "kotoba.activity.v1";
export const AREAS = ["kana", "vocab", "kanji"] as const;
export type Area = (typeof AREAS)[number];
// One study day: distinct minute-of-day buckets (0–1439) with any study action, and distinct item ids touched.
// kanji came later, so days stored before it have no kanji list.
export type Day = { minutes: number[]; kana: string[]; vocab: string[]; kanji?: string[] };
export type Activity = { days: Record<string, Day>; last?: { area: Area; ref: string } };
export const KEEP_DAYS = 90;

// Day and minute on the Vietnam wall clock (ADR 003). h23 keeps midnight at "00", never "24".
const clock = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDY_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
function studyClock(d: Date): { day: string; minute: number } {
  const p = Object.fromEntries(clock.formatToParts(d).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, minute: Number(p.hour) * 60 + Number(p.minute) };
}
// The one place a moment becomes a study day: activity days, SRS due dates and "today" all go through it.
export const dayKey = (d: Date): string => studyClock(d).day;

// ponytail: minutes = distinct minutes with an answer or flip, a lower bound. Real session timing when the API exists.
export function record(a: Activity, area: Area, ref: string, now: Date): Activity {
  const { day: key, minute } = studyClock(now);
  const prev = a.days[key] ?? { minutes: [], kana: [], vocab: [] };
  const day: Day = {
    ...prev,
    minutes: prev.minutes.includes(minute) ? prev.minutes : [...prev.minutes, minute],
    [area]: prev[area]?.includes(ref) ? prev[area] : [...(prev[area] ?? []), ref],
  };
  const oldest = addDays(key, -KEEP_DAYS);
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

// Corrupt log → keep a copy, then start fresh (ADR 008).
export function logActivity(area: Area, ref: string): void {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const a = parseActivity(raw);
    if (a === null && raw !== null) keepBroken(ACTIVITY_KEY, raw);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(record(a ?? { days: {} }, area, ref, new Date())));
  } catch {
    // Deliberate: study goes on without this entry, the dashboard shows the warning, and a log that could not be copied stays.
  }
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
  const today = dayKey(now);
  let d = a.days[today] ? today : addDays(today, -1);
  let streak = 0;
  while (a.days[d]) {
    streak++;
    d = addDays(d, -1);
  }
  const t = a.days[today];
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

// Heatmap (phase 20): HEAT_WEEKS Monday-first columns, the last one holding today; days after today are null.
// Levels follow HEAT_LEVELS minute thresholds. Day keys only, so the grid follows the study day (ADR 003).
export type HeatCell = { day: string; minutes: number; level: number };
export type Heat = { weeks: (HeatCell | null)[][]; activeDays: number; totalMinutes: number };

export function heat(a: Activity, today: string): Heat {
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  const start = addDays(today, -((HEAT_WEEKS - 1) * 7 + weekday));
  let activeDays = 0;
  let totalMinutes = 0;
  const weeks = Array.from({ length: HEAT_WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(start, w * 7 + d);
      if (day > today) return null;
      const minutes = a.days[day]?.minutes.length ?? 0;
      if (minutes) activeDays++;
      totalMinutes += minutes;
      return { day, minutes, level: HEAT_LEVELS.filter((m) => minutes >= m).length };
    }),
  );
  return { weeks, activeDays, totalMinutes };
}
