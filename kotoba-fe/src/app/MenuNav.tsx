"use client";
import type { ReactNode } from "react";

// The nav is a popover below 900px. SiteBar stays mounted across client navigations,
// so a link click closes it (and the library popover) by hand.
export function MenuNav({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <nav
      id={id}
      popover="auto"
      aria-label={label}
      onClick={(e) => {
        if (!(e.target as Element).closest("a")) return;
        for (const p of [e.currentTarget, ...e.currentTarget.querySelectorAll<HTMLElement>("[popover]")])
          if (p.matches(":popover-open")) p.hidePopover();
      }}
    >
      {children}
    </nav>
  );
}
