import Link from "next/link";
import { getLang, LangSwitch } from "./LangSwitch";
import { dict } from "@/lib/i18n";
import { currentUser } from "@/lib/auth";
import { BarStats } from "./BarStats";
import { LogoutButton, SyncStatus } from "./Sync";
import { MenuNav } from "./MenuNav";
import { ReviewLink } from "./ReviewLink";
export { Arrow } from "./Arrow";

// Pages name themselves; the five tabs (AC-17) group them. /flashcards is a vocab deck, so it passes "vocab".
const TAB = {
  today: "today", lessons: "path", review: "practice", test: "practice", progress: "progress",
  library: "library", kana: "library", kanji: "library", vocab: "library", grammar: "library", search: "search",
} as const;
type Current = keyof typeof TAB;

// Phase 41i: five tabs (a row in the bar from 900px up, a bottom tab bar below; globals.css "Site bar"),
// streak and XP, and a More nav for search, account and language (inline from 900px up, a popover below).
export async function SiteBar({ current }: { current?: Current }) {
  const lang = await getLang();
  const t = dict(lang).nav;
  const user = await currentUser();
  const tab = current && TAB[current];
  const here = (k: (typeof TAB)[Current]) => (tab === k ? "page" : undefined);
  return (
    <header className="bar">
      <Link href="/" className="brand">
        <span lang="ja" className="brandMark" aria-hidden="true">言葉</span>
        <span className="brandWord">Kotoba</span>
        <span className="sr-only">{t.home}</span>
      </Link>
      <nav className="tabs" aria-label={t.main}>
        <Link href="/" aria-current={here("today")}>{t.today}</Link>
        <Link href="/lessons" aria-current={here("path")}>{t.path}</Link>
        <ReviewLink label={t.practice} due={t.reviewDue} current={here("practice")} />
        <Link href="/library" aria-current={here("library")}>{t.library}</Link>
        <Link href="/progress" aria-current={here("progress")}>{t.progress}</Link>
      </nav>
      <BarStats lang={lang} />
      <button type="button" className="btn btnGhost menuBtn" popoverTarget="site-nav">{t.more}</button>
      <MenuNav id="site-nav" label={t.more}>
        <Link href="/search" aria-current={here("search")}>{t.search}</Link>
        {user ? (
          <>
            <Link href="/settings" className="who" aria-label={`${t.settings}, ${user.email}`}>{user.email}</Link>
            <LogoutButton label={t.logout} />
          </>
        ) : (
          <Link href="/login">{t.login}</Link>
        )}
        <LangSwitch lang={lang} />
      </MenuNav>
      {/* Outside the menu so a failed sync stays in sight on small screens, where the menu is a closed popover. */}
      {user && <SyncStatus uid={user.email} lang={lang} />}
    </header>
  );
}

export async function SiteFooter() {
  const t = dict(await getLang()).footer;
  return (
    <footer className="siteFooter">
      <p>
        {t.kanji}: KANJIDIC2 · {t.dict}: JMdict · CC BY-SA 4.0 · {t.hv}: hanviet-pinyin-wordlist · {t.strokes}: KanjiVG (CC BY-SA 3.0) · <Link href="/legal">{t.legal}</Link>
      </p>
    </footer>
  );
}
