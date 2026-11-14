// Business constants for the API. See AGENTS.md §5.3.

// Upper bound on a card's wrong-answer count; far above any real deck, it only stops junk pushes (phase 16).
export const MAX_LAPSES = 10000;
// Limit one progress push; leaves room above the current ~4,100 content items.
export const MAX_PUSH_CARDS = 10000;
// Shape of the GET /me/export file (phase 21). Bump when its fields change.
export const EXPORT_VERSION = 1;
// JLPT levels the content covers, easiest first (phase 22; N2 dropped in phase 37). Items without a level are N5.
export const LEVELS = [5, 4, 3];
export const DEFAULT_LEVEL = 5;
// Items per page of GET /content/:kind?page= (phase 22).
export const PAGE_SIZE = 100;
