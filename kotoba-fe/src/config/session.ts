// Phase 41 study session (/session).
// New items are taught this many at a time, then checked together.
export const CHUNK = 3;
// Grammar points a session introduces at most.
export const GRAMMAR_PER_SESSION = 2;
// "Học thêm 5 phút": new items past the daily cap.
export const EXTRA_NEW = 5;
// Rough seconds per step, for the "n phút" estimates.
export const STEP_SECONDS = { review: 10, learn: 20, quiz: 8, grammar: 40, order: 30, practice: 15 } as const;
// Daily goal when the profile has none.
export const DEFAULT_MINUTES = 15;
