// A card is "often wrong" from this many wrong answers.
export const WEAK_MIN_LAPSES = 2;
// Rows in the dashboard block "Hay sai".
export const WEAK_LIST_SIZE = 5;
// Same cap as kotoba-be (src/config.ts MAX_LAPSES): a larger count would make every push fail with 400.
export const MAX_LAPSES = 10000;
// New items the daily session at /review brings in per study day (phase 18).
export const NEW_PER_DAY = 10;
// Days until the next review after 1, 2, 3… correct reviews in a row.
export const INTERVALS = [1, 3, 7, 14, 30];
// Box = correct reviews in a row. Known = passed the review that came after the 30-day gap.
export const KNOWN_AT = INTERVALS.length + 1;
// /review levels (phase 41f): Mới box 0 → Đang học → Thuộc from this box (passed the 3-day gap) → Vững from KNOWN_AT.
export const HELD_AT = 3;
// Days in the /review due chart, today first.
export const WEEK_DAYS = 7;
