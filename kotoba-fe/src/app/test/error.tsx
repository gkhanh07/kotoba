"use client";

import Link from "next/link";
import { clientLang, dict } from "@/lib/i18n";
import s from "./test.module.css";

export default function TestError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = dict(clientLang()).status;
  return (
    <div className={s.status} role="alert">
      <span lang="ja" className={s.statusSign} data-off="true">試験</span>
      <p>{t.errorBody}</p>
      <div className={s.statusActions}>
        <button type="button" className="btn" onClick={() => retry()}>{t.retry}</button>
        <Link href="/" className="btn btnGhost">{t.home}</Link>
      </div>
    </div>
  );
}
