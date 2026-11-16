"use client";
// Phase 41i (AC-18): three questions on real N5 data, no account and nothing saved.
import { useRef, useState } from "react";
import { dict, type Lang } from "@/lib/i18n";
import type { TrialQuestion } from "@/lib/trial";
import { Choices } from "./session/Choices";
import { sessionText } from "./session/text";
import s from "./page.module.css";

export function GuestTrial({ questions, lang }: { questions: TrialQuestion[]; lang: Lang }) {
  const t = dict(lang).home;
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const q = questions[step];
  const ask = step > 0 && q === questions[0] ? t.trialAgain : t.trialAsk[q?.kind ?? "reading"];
  const pick = (id: string) => {
    setPicked(id);
    if (id === q.answer) setRight((n) => n + 1);
    requestAnimationFrame(() => nextRef.current?.focus());
  };
  // The Next button disables itself, so focus moves to the panel: keys 1–4 keep working there.
  const next = () => { setPicked(null); setStep(step + 1); panelRef.current?.focus(); };
  const restart = () => { setPicked(null); setRight(0); setStep(0); };

  return (
    <div ref={panelRef} tabIndex={-1} className={`panel ${s.trial}`}>
      {q ? (
        <>
          <p className={s.trialStep}>{t.trialStep(step + 1, questions.length)}</p>
          <p className={s.trialAsk}>{ask}</p>
          <p lang="ja" className={s.trialFront}>{q.front}</p>
          {/* key: a repeated question starts fresh instead of keeping the last pick's state. */}
          <Choices key={step} choices={q.choices} picked={picked} answer={q.answer} onPick={pick} t={sessionText[lang]} within={panelRef} />
          <p aria-live="polite" className={s.trialResult}>
            {picked && `${picked === q.answer ? "✓" : "✗"} ${q.front} = ${q.choices.find((c) => c.id === q.answer)?.label}`}
          </p>
          {/* Ghost: the landing keeps one amber action (AC-2.2). */}
          <button ref={nextRef} type="button" className="btn btnGhost" disabled={!picked} onClick={next}>{t.trialNext}</button>
        </>
      ) : (
        <>
          <p role="status">{t.trialDone(right, questions.length)}</p>
          <button type="button" className="btn btnGhost" onClick={restart}>{t.trialRetry}</button>
        </>
      )}
    </div>
  );
}
