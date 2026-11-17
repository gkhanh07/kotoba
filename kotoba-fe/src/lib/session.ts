// Phase 41 (ADR 013): one study session built from the current lesson. Pure, client-safe.
import { CHUNK, EXTRA_NEW, GRAMMAR_PER_SESSION, STEP_SECONDS } from "@/config/session";
import { freshFor } from "./daily";
import { questionFor } from "./grammarQuiz";
import { currentLesson, stopsOf, type Grammar, type Kind } from "./library";
import { isDue, type Srs } from "./srs";

export const SESSION_KEY = "kotoba.session.v1";
export const STEP_KINDS = ["review", "learn", "quiz", "grammar", "order", "practice"] as const;
export type StepKind = (typeof STEP_KINDS)[number];
export type Step = { kind: StepKind; id: string };
export type Mode = "full" | "review" | "more";
export const MODES: readonly Mode[] = ["full", "review", "more"];
// first: each graded id's first grade this session (the % right counts only these).
// xp0: XP when the session was built, for the session's XP change (ADR 014).
// graded: the current step was already graded (SRS written) but not left yet; a resume moves on instead of grading twice.
export type SessionState = { day: string; mode: Mode; steps: Step[]; index: number; first: Record<string, boolean>; graded?: boolean; xp0?: number };

export type SessionInput = {
  items: { id: string; kind: Kind; lesson: number }[];
  grammar: Grammar[];
  srs: Srs;
  today: string;
  learnedToday: number;
  perDay: number;
  mode: Mode;
};

// Order (AC-1): due reviews → new items in chunks (learn ×3, then a quick check of those 3) → the lesson's new grammar →
// sentence ordering → fill-in practice. review mode: reviews only; more: no reviews, EXTRA_NEW past the cap.
export function buildSession({ items, grammar, srs, today, learnedToday, perDay, mode }: SessionInput): Step[] {
  const practicable = (g: Grammar) => questionFor(g) !== null;
  const reviews: Step[] = mode === "more" ? [] : [
    ...items.filter((i) => isDue(srs[i.id], today)).map((i) => ({ kind: "review" as const, id: i.id })),
    ...grammar.filter((g) => isDue(srs[g.id], today) && practicable(g)).map((g) => ({ kind: "practice" as const, id: g.id })),
  ];
  if (mode === "review") return reviews;

  // A lesson's kanji come after its words (sorted before the daily cap cuts): the words give the kanji something to hang on.
  const stops = stopsOf([...items.filter((i) => i.kind !== "kanji"), ...items.filter((i) => i.kind === "kanji")]);
  const fresh = mode === "more" ? freshFor(stops, srs, 0, EXTRA_NEW) : freshFor(stops, srs, learnedToday, perDay);
  const ids = fresh.ids;
  const learn: Step[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    learn.push(...chunk.map((id) => ({ kind: "learn" as const, id })), ...chunk.map((id) => ({ kind: "quiz" as const, id })));
  }

  const lesson = fresh.lesson ?? currentLesson(stops, srs);
  const points = grammar.filter((g) => g.lesson === lesson && !srs[g.id]).slice(0, GRAMMAR_PER_SESSION);
  const step = (kind: StepKind) => (g: Grammar) => ({ kind, id: g.id });
  return [
    ...reviews,
    ...learn,
    ...points.map(step("grammar")),
    ...points.filter((g) => g.examples.some((e) => (e.parts?.length ?? 0) >= 2)).map(step("order")),
    ...points.filter(practicable).map(step("practice")),
  ];
}

// correct undefined: a step with nothing to grade (learn, grammar). A miss repeats the step at the end (AC-3).
export function advance(s: SessionState, correct?: boolean): SessionState {
  const step = s.steps[s.index];
  return {
    ...s,
    steps: correct === false ? [...s.steps, step] : s.steps,
    index: s.index + 1,
    first: correct === undefined || step.id in s.first ? s.first : { ...s.first, [step.id]: correct },
    graded: undefined,
  };
}

export const minutesFor = (steps: Step[]) => Math.ceil(steps.reduce((n, s) => n + STEP_SECONDS[s.kind], 0) / 60);

// Resume only the same study day and mode; anything else (or a broken value) → null, and a new session is built.
export function parseSession(raw: string | null, day: string, mode: Mode): SessionState | null {
  try {
    const o = JSON.parse(raw ?? "null") as SessionState | null;
    const ok = o && o.day === day && o.mode === mode && Number.isInteger(o.index) && o.index >= 0 && Array.isArray(o.steps) && o.index <= o.steps.length
      && o.steps.every((s) => STEP_KINDS.includes(s?.kind) && typeof s.id === "string")
      && (o.graded === undefined || typeof o.graded === "boolean")
      && (o.xp0 === undefined || Number.isInteger(o.xp0))
      && typeof o.first === "object" && o.first !== null && !Array.isArray(o.first) && Object.values(o.first).every((v) => typeof v === "boolean");
    return ok ? o : null;
  } catch {
    return null;
  }
}

// A saved step must still run: its item in scope, an ordering example with parts, a fill-in question.
export function runsIn(items: { id: string }[], grammar: Grammar[]): (s: Step) => boolean {
  const ids = new Set(items.map((i) => i.id));
  const byId = new Map(grammar.map((g) => [g.id, g]));
  return (st) => {
    if (st.kind !== "grammar" && st.kind !== "order" && st.kind !== "practice") return ids.has(st.id);
    const g = byId.get(st.id);
    if (!g) return false;
    if (st.kind === "order") return g.examples.some((e) => (e.parts?.length ?? 0) >= 2);
    return st.kind === "grammar" || questionFor(g) !== null;
  };
}

// The saved session /session resumes, and so what the home page shows: an empty one, or one naming steps that no longer
// run, is dropped (null: a new one is built); a step graded but not left moves on with that grade.
export function resumable(saved: SessionState | null, runs: (s: Step) => boolean): SessionState | null {
  if (!saved || saved.steps.length === 0 || !saved.steps.every(runs)) return null;
  return saved.graded !== undefined && saved.index < saved.steps.length ? advance(saved, saved.graded) : saved;
}

// The five parts the home page lists (AC-12). A quick check goes with what it checks; grammar's ordering goes with grammar.
export const PARTS = ["review", "new", "kanji", "grammar", "practice"] as const;
export type Part = (typeof PARTS)[number];
export type PartLine = { part: Part; count: number; minutes: number; done: boolean };

export function partsOf(steps: Step[], index: number, kindOf: (id: string) => Kind | undefined): PartLine[] {
  const partOf = (s: Step): Part =>
    s.kind === "review" ? "review"
      : s.kind === "learn" || s.kind === "quiz" ? (kindOf(s.id) === "kanji" ? "kanji" : "new")
      : s.kind === "order" ? "grammar"
      : s.kind;
  return PARTS.map((part) => {
    const mine = steps.map((s, i) => ({ s, i })).filter(({ s }) => partOf(s) === part);
    return {
      part,
      count: new Set(mine.map(({ s }) => s.id)).size,
      minutes: minutesFor(mine.map(({ s }) => s)),
      done: mine.length > 0 && mine.every(({ i }) => i < index),
    };
  });
}

// Today's session as the home page sees it: a saved one of today (in progress or finished), else the one /session would build.
export type Today = { state: "start" | "resume" | "done"; steps: Step[]; index: number };
export function todayOf(saved: SessionState | null, fresh: Step[]): Today {
  if (saved && saved.steps.length > 0) return { state: saved.index < saved.steps.length ? "resume" : "done", steps: saved.steps, index: saved.index };
  return fresh.length > 0 ? { state: "start", steps: fresh, index: 0 } : { state: "done", steps: [], index: 0 };
}
