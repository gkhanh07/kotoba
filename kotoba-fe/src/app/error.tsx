"use client";
import { clientLang, dict } from "@/lib/i18n";

// The BE is the usual cause (lib/auth.ts throws when it can't be reached); retry re-renders once it's back.
export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = dict(clientLang()).down;
  return (
    <main className="statusPage">
      <span lang="ja" className="statusMark" data-off="" aria-hidden="true">停電</span>
      <div role="alert">
        <h1>{t.title}</h1>
        <p>{t.body}</p>
      </div>
      <button type="button" className="btn" onClick={() => retry()}>{t.retry}</button>
    </main>
  );
}
