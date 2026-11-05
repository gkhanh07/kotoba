"use client";
import { useSyncExternalStore } from "react";

// Browser text-to-speech with a Japanese voice. Without one the button is not rendered at all:
// a voice from another language would read kanji wrong.
const jaVoice = () =>
  typeof speechSynthesis === "undefined" ? undefined : speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("ja"));

function subscribe(cb: () => void) {
  if (typeof speechSynthesis === "undefined") return () => {};
  speechSynthesis.addEventListener("voiceschanged", cb);
  return () => speechSynthesis.removeEventListener("voiceschanged", cb);
}

export function Speak({ text, label, className = "btn btnGhost" }: { text: string; label: string; className?: string }) {
  const ready = useSyncExternalStore(subscribe, () => !!jaVoice(), () => false);
  if (!ready) return null;
  function speak() {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = jaVoice() ?? null;
    u.lang = "ja-JP";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  return (
    <button type="button" className={className} onClick={speak} aria-label={`${label} ${text}`}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M5 3.5v11l9-5.5-9-5.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="miter" />
      </svg>
      {label}
    </button>
  );
}
