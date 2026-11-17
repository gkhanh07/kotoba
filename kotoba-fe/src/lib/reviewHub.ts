// Numbers on the /review hub, all derived from the deck and the content list (never stored).
import { HELD_AT, KNOWN_AT, WEAK_MIN_LAPSES, WEEK_DAYS } from "@/config/srs";
import { KINDS, type Kind } from "./library";
import { daysUntil, isDue, isLearned, type Srs } from "./srs";

export type HubCard = { id: string; kind: Kind };
export type KindSummary = { due: number; total: number; weak: number };
export type HubSummary = {
  due: number;
  // Due before today: the schedule has already slipped, so these are the ones being forgotten.
  overdue: number;
  started: number;
  // Share of started cards answered right since their last miss; null until a card has been started.
  retention: number | null;
  weakTotal: number;
  // Started cards per level: Má»›i, Äang há»c, Thuá»™c, Vá»¯ng (box 0 / 1 to HELD_AT âˆ’ 1 / HELD_AT to KNOWN_AT âˆ’ 1 / KNOWN_AT+).
  levels: [number, number, number, number];
  // Cards coming due on each of the next WEEK_DAYS days; today also holds the overdue ones.
  week: number[];
  kinds: Record<Kind, KindSummary>;
};

export function hubSummary(cards: HubCard[], srs: Srs, today: string): HubSummary {
  const kinds = Object.fromEntries(KINDS.map((k) => [k, { due: 0, total: 0, weak: 0 }])) as Record<Kind, KindSummary>;
  let overdue = 0;
  let started = 0;
  let learned = 0;
  const levels: HubSummary["levels"] = [0, 0, 0, 0];
  const week: number[] = Array(WEEK_DAYS).fill(0);
  for (const { id, kind } of cards) {
    const k = kinds[kind];
    k.total++;
    const c = srs[id];
    if (!c) continue;
    started++;
    if (isLearned(srs, id)) learned++;
    levels[c.box >= KNOWN_AT ? 3 : c.box >= HELD_AT ? 2 : c.box >= 1 ? 1 : 0]++;
    const d = Math.max(0, daysUntil(c.due, today));
    if (d < WEEK_DAYS) week[d]++;
    if (isDue(c, today)) k.due++;
    if (c.due < today) overdue++;
    if ((c.lapses ?? 0) >= WEAK_MIN_LAPSES) k.weak++;
  }
  const sum = (f: (k: KindSummary) => number) => KINDS.reduce((n, kind) => n + f(kinds[kind]), 0);
  return {
    due: sum((k) => k.due), overdue, started, retention: started ? Math.round((100 * learned) / started) : null,
    weakTotal: sum((k) => k.weak), kinds, levels, week,
  };
}
