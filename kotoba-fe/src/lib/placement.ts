// Phase 40h (AC-14): a short placement test drawn from the first mock paper of each level.
import type { Level } from "./library";
import type { Paper, Question } from "./test";

const PARTS = ["kanji", "context", "grammar"]; // short, self-contained questions; no passages
const PER_PART = 2;
const PASS = 0.6; // share of a level's questions right to count it as known

export type PlacementQ = Question & { level: Level; part: string };
export type LevelScore = { level: Level; right: number; total: number };

// Papers in level order, easiest first (N5, N4, N3).
export function placementQuestions(papers: { level: Level; paper: Paper }[]): PlacementQ[] {
  return papers.flatMap(({ level, paper }) =>
    PARTS.flatMap((part) =>
      paper.parts
        .filter((p) => p.part === part && !p.passage)
        .flatMap((p) => p.questions)
        .slice(0, PER_PART)
        .map((x) => ({ ...x, level, part })),
    ),
  );
}

// The suggested level is the first one not passed, or the top one when all are.
export function suggest(qs: PlacementQ[], answers: (number | null)[]): { level: Level; levels: LevelScore[] } {
  const levels: LevelScore[] = [];
  qs.forEach((x, i) => {
    let s = levels.find((l) => l.level === x.level);
    if (!s) levels.push((s = { level: x.level, right: 0, total: 0 }));
    s.total++;
    if (answers[i] === x.answer) s.right++;
  });
  const weak = levels.find((l) => l.right < PASS * l.total);
  return { level: (weak ?? levels[levels.length - 1])?.level ?? 5, levels };
}
