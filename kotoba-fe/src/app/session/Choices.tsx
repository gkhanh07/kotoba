"use client";
// Shared by /session and the guest trial on the home page (phase 41i).
import { useEffect, useRef, type RefObject } from "react";
import type { SessionText } from "./text";
import s from "./session.module.css";

export const dialogOpen = () => document.querySelector('[role="alertdialog"]') !== null;

// Keys a step listens to; none while the learner types in a field (AC-8).
export function useKeys(handler: (key: string) => void) {
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      // Typing goes to the field; Esc still leaves from it.
      if (e.key !== "Escape" && (e.target as Element).closest?.("input, textarea, select, [contenteditable]")) return;
      // The exit dialog takes every key but Esc.
      if (e.key !== "Escape" && dialogOpen()) return;
      ref.current(e.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

// Four choices, then right/wrong in colour + ✓/✗ and one line from the data (AC-6). Choices are numbered for 1–4.
// within: on a page with other content (the guest trial), 1–4 count only while focus is inside it.
export function Choices({ choices, picked, answer, onPick, t, within }: {
  choices: { id: string; label: string; ja?: boolean }[]; picked: string | null; answer: string; onPick: (id: string) => void; t: Pick<SessionText, "right" | "wrong">;
  within?: RefObject<HTMLElement | null>;
}) {
  useKeys((k) => {
    if (within && !within.current?.contains(document.activeElement)) return;
    if (/^[1-4]$/.test(k) && !picked && choices[Number(k) - 1]) onPick(choices[Number(k) - 1].id);
  });
  return (
    <ol className={s.choices}>
      {choices.map((c, i) => {
        const state = !picked ? undefined : c.id === answer ? "right" : c.id === picked ? "wrong" : undefined;
        return (
          <li key={c.id}>
            <button type="button" className={s.choice} data-state={state} disabled={!!picked} onClick={() => onPick(c.id)}>
              <kbd aria-hidden="true">{i + 1}</kbd>
              <span lang={c.ja ? "ja" : undefined}>{c.label}</span>
              {state && " "}
              {state && <span className={s.mark}>{state === "right" ? `✓ ${t.right}` : `✗ ${t.wrong}`}</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

