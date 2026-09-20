import Link from "next/link";
import { getLang, LangSwitch } from "./LangSwitch";
import { dict } from "@/lib/i18n";

export function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9h11M9.5 4.5 14 9l-4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

export async function SiteBar({ current }: { current?: "chart" | "quiz" }) {
  const lang = await getLang();
  const t = dict(lang).nav;
  return (
    <header className="bar">
      <Link href="/" className="brand" aria-label={t.home}>
        <span lang="ja" className="brandMark">言葉</span>
        <span className="brandWord">Kotoba</span>
      </Link>
      <nav aria-label={t.main}>
        <Link href="/kana" aria-current={current === "chart" ? "page" : undefined}>{t.chart}</Link>
        <Link href="/kana?mode=quiz" aria-current={current === "quiz" ? "page" : undefined}>{t.quiz}</Link>
        <LangSwitch lang={lang} />
      </nav>
    </header>
  );
}
