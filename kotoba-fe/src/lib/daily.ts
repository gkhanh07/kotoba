// Phase 18 daily session: how many new items were learned today, which new items come next,
// the end-of-session numbers, and where the dashboard's "continue" goes. Pure functions (ADR 004).
import { continueHref, type Activity } from "./activity";
import { currentLesson, type Stop } from "./library";
import { isLearned, type Srs } from "./srs";

export const DAILY_KEY = "kotoba.daily.v1";
// ids: items that got their first grade on `day` (a study day key).
export type Daily = { day: string; ids: string[] };

// Unreadable or wrong shape → null; the caller counts it as nothing learned today.
export function parseDaily(raw: string | null): Daily | null {
  if (raw === null) return null;
  try {
    const o = JSON.parse(raw) as Daily | null;
    return o && typeof o.day === "string" && Array.isArray(o.ids) && o.ids.every((x) => typeof x === "string") ? o : null;
  } catch {
    return null;
  }
}

export const newToday = (d: Daily | null, day: string): number => (d?.day === day ? d.ids.length : 0);

export function noteNew(d: Daily | null, id: string, day: string): Daily {
  const ids = d?.day === day ? d.ids : [];
  return { day, ids: ids.includes(id) ? ids : [...ids, id] };
}

// Never-seen items of the current lesson, up to what is left of today's allowance.
export function freshFor(stops: Stop[], srs: Srs, learnedToday: number, perDay: number): { lesson?: number; ids: string[] } {
  const lesson = currentLesson(stops, srs);
  const budget = Math.max(0, perDay - learnedToday);
  const ids = stops.find((p) => p.lesson === lesson)?.ids.filter((id) => !srs[id]).slice(0, budget) ?? [];
  return { lesson, ids };
}

// first: each graded item's first grade this session; minutes: clock minutes (ms / 60000) with a grade.
export function sessionStats(first: Record<string, boolean>, minutes: number[]): { items: number; pct: number; minutes: number } {
  const grades = Object.values(first);
  const right = grades.filter(Boolean).length;
  return { items: grades.length, pct: grades.length ? Math.round((100 * right) / grades.length) : 0, minutes: new Set(minutes).size };
}

// Dashboard "Tiếp tục học": today's session when it has work, else back to the last area studied.
export function continueTarget(due: number, fresh: number, last: Activity["last"]): { href: string; daily: boolean } {
  return due + fresh > 0 ? { href: "/review?start=1", daily: true } : { href: continueHref(last), daily: false };
}

// Phase 40i (AC-16) daily plan: new items a day so the items not yet learned are all met by exam day.
// Exam day itself is not counted; null when the exam is today, past or not set.
export const perDayFor = (left: number, days: number | null): number | null => (days !== null && days > 0 ? Math.ceil(left / days) : null);

// Dashboard stage bar: the first area, kana → kanji → vocab, with something left to learn; vocab once all are done.
export type Area = "kana" | "kanji" | "vocab";
export function stageOf(scope: Record<Area, string[]>, srs: Srs): { area: Area; learned: number; total: number } {
  const areas = (["kana", "kanji", "vocab"] as const).map((area) => ({
    area, learned: scope[area].filter((id) => isLearned(srs, id)).length, total: scope[area].length,
  }));
  return areas.find((a) => a.learned < a.total) ?? areas[2];
}
