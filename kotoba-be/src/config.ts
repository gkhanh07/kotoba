// Business constants for the API. See AGENTS.md §5.3.

// Upper bound on a card's wrong-answer count; far above any real deck, it only stops junk pushes (phase 16).
export const MAX_LAPSES = 10000;
// Shape of the GET /me/export file (phase 21). Bump when its fields change.
export const EXPORT_VERSION = 1;
