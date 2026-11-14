// Mock test logic: pure functions and the shapes shared with kotoba-be (GET /tests/:id). No storage here.
import { TEST_SESSION_VERSION } from "@/config/test";

export type Question = { q: string; choices: string[]; answer: number; explain: string };
export type Part = { part: string; passage?: string; questions: Question[] };
export type Paper = { id: string; title: { vi: string; en: string }; minutes: number; reviewed: boolean; parts: Part[] };
export type Flat = Question & { index: number; part: string; passage?: string };
export type PartScore = { part: string; right: number; total: number };
export type Score = { right: number; total: number; parts: PartScore[] };
export type Result = Score & { answers: (number | null)[]; at: number };
export type Results = Record<string, Result>;
export type Session = { v: 1; startedAt: number; answers: (number | null)[]; flagged: number[]; current: number };
export type Segment = { text: string; kind: "plain" | "underline" | "blank" };

const MS_PER_MINUTE = 60_000;
const MS_PER_SECOND = 1000;

// Questions are addressed by their index across all parts, in paper order.
export function flatten(paper: Paper): Flat[] {
  const out: Flat[] = [];
  for (const p of paper.parts)
    for (const q of p.questions) out.push({ ...q, index: out.length, part: p.part, passage: p.passage });
  return out;
}

// A paper made of just these questions (retry of the wrong ones), numbered 1..N again.
export function subset(paper: Paper, ids: number[]): Paper {
  const flat = flatten(paper);
  const parts = ids.map((i): Part => {
    const { part, passage, q, choices, answer, explain } = flat[i];
    return { part, passage, questions: [{ q, choices, answer, explain }] };
  });
  return { ...paper, parts };
}

// Unanswered counts as wrong. Parts are grouped by name (several reading passages are one part).
export function score(paper: Paper, answers: (number | null)[]): Score {
  const parts: PartScore[] = [];
  let right = 0;
  for (const f of flatten(paper)) {
    let entry = parts.find((p) => p.part === f.part);
    if (!entry) parts.push((entry = { part: f.part, right: 0, total: 0 }));
    entry.total++;
    if (answers[f.index] === f.answer) {
      entry.right++;
      right++;
    }
  }
  return { right, total: parts.reduce((n, p) => n + p.total, 0), parts };
}

export function wrongIds(paper: Paper, answers: (number | null)[]): number[] {
  return flatten(paper).filter((f) => answers[f.index] !== f.answer).map((f) => f.index);
}

// The clock is derived from the start time, never counted by ticks, so a sleeping tab stays right.
export function remaining(startedAt: number, minutes: number, now: number): number {
  return Math.max(0, startedAt + minutes * MS_PER_MINUTE - now);
}

export function weakest(result: Score): PartScore | null {
  let worst: PartScore | null = null;
  for (const p of result.parts) {
    if (p.total === 0) continue;
    // Cross-multiplied so ratios compare without rounding; strict < keeps the first part on a tie.
    if (!worst || p.right * worst.total < worst.right * p.total) worst = p;
  }
  return worst;
}

export function formatClock(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / MS_PER_SECOND));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export const percent = (right: number, total: number) => (total === 0 ? 0 : Math.round((100 * right) / total));
export const headline = (right: number, total: number) => `${right}/${total} — ${percent(right, total)}%`;

// {…} marks the underlined word of a kanji question, ★ the box of a sentence-order question.
export function segments(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(/\{([^}]*)\}|★/g)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), kind: "plain" });
    out.push(m[1] === undefined ? { text: "★", kind: "blank" } : { text: m[1], kind: "underline" });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), kind: "plain" });
  return out;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isAnswers = (v: unknown): v is (number | null)[] => Array.isArray(v) && v.every((x) => x === null || isNum(x));
const isPartScore = (v: unknown): v is PartScore => isRecord(v) && typeof v.part === "string" && isNum(v.right) && isNum(v.total);
const isResult = (v: unknown): v is Result =>
  isRecord(v) && isNum(v.right) && isNum(v.total) && isNum(v.at) && isAnswers(v.answers) && Array.isArray(v.parts) && v.parts.every(isPartScore);

function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null; // broken storage is treated as absent; callers never overwrite it without a backup
  }
}

export function parseSession(raw: string | null): Session | null {
  const v = parseJson(raw);
  if (!isRecord(v) || v.v !== TEST_SESSION_VERSION) return null;
  if (!isNum(v.startedAt) || !isAnswers(v.answers) || !isNum(v.current)) return null;
  if (!Array.isArray(v.flagged) || !v.flagged.every(isNum)) return null;
  return { v: TEST_SESSION_VERSION, startedAt: v.startedAt, answers: v.answers, flagged: v.flagged, current: v.current };
}

export function parseResults(raw: string | null): Results | null {
  const v = parseJson(raw);
  if (!isRecord(v)) return null;
  return Object.values(v).every(isResult) ? (v as Results) : null;
}
