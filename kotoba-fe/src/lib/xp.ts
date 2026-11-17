// Phase 41 XP (ADR 014): what is remembered now, so a missed card can take XP away.
import { XP_PER_BOX, XP_PER_CARD, XP_PER_LEVEL } from "@/config/xp";
import type { Srs } from "./srs";

export const xpOf = (srs: Srs): number => Object.values(srs).reduce((n, c) => n + XP_PER_BOX * c.box + XP_PER_CARD, 0);

// Level 1 from 0 XP; into: XP inside this level, need: XP left to the next.
export function levelOf(xp: number): { level: number; into: number; need: number } {
  const into = xp % XP_PER_LEVEL;
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, into, need: XP_PER_LEVEL - into };
}
