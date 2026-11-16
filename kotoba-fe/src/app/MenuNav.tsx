"use client";
import type { ReactNode } from "react";

// The More nav is a popover below 900px. SiteBar stays mounted across client navigations,
// so a link click closes it by hand.
export function MenuNav({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <nav
      id={id}
      popover="auto"
      className="float"
      aria-label={label}
      onClick={(e) => {
        if (!(e.target as Element).closest("a")) return;
        if (e.currentTarget.matches(":popover-open")) e.currentTarget.hidePopover();
      }}
    >
      {children}
    </nav>
  );
}
