import Link from "next/link";
import { getLang, LangSwitch } from "./LangSwitch";
import { dict } from "@/lib/i18n";
import { currentUser } from "@/lib/auth";
import { LogoutButton, SyncStatus } from "./Sync";
import { MenuNav } from "./MenuNav";
import { ReviewLink } from "./ReviewLink";
export { Arrow } from "./Arrow";

const LIBRARY = ["kana", "kanji", "vocab", "grammar"] as const; // /flashcards is a vocab deck, so it passes "vocab"
type Current = "lessons" | "review" | "test" | "search" | (typeof LIBRARY)[number];

// One nav element: a row from 900px up, the Menu popover below (globals.css, "Site bar").
export async function SiteBar({ current }: { current?: Current }) {
  const lang = await getLang();
  const t = dict(lang).nav;
  const user = await currentUser();
  const here = (k: Current) => (current === k ? "page" : undefined);
  return (
    <header className="bar">
      <Link href="/" className="brand">
        <span lang="ja" className="brandMark" aria-hidden="true">言葉</span>
        <span className="brandWord">Kotoba</span>
        <span className="sr-only">{t.home}</span>
      </Link>
      <button type="button" className="btn btnGhost menuBtn" popoverTarget="site-nav">{t.menu}</button>
      <MenuNav id="site-nav" label={t.main}>
        <Link href="/lessons" aria-current={here("lessons")}>{t.lessons}</Link>
        <ReviewLink label={t.review} due={t.reviewDue} current={here("review")} />
        <Link href="/test" aria-current={here("test")}>{t.test}</Link>
        <Link href="/search" aria-current={here("search")}>{t.search}</Link>
        <button type="button" className="libraryBtn" popoverTarget="site-library" data-current={(LIBRARY as readonly string[]).includes(current ?? "") ? "" : undefined}>
          {t.library}
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3.5 5 7.5 9 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
        <div id="site-library" popover="auto" className="library">
          <Link href="/kana" aria-current={here("kana")}>{t.kana}</Link>
          <Link href="/kanji" aria-current={here("kanji")}>{t.kanji}</Link>
          <Link href="/vocab" aria-current={here("vocab")}>{t.vocab}</Link>
          <Link href="/grammar" aria-current={here("grammar")}>{t.grammar}</Link>
        </div>
        <div className="account">
          {user ? (
            <>
              <Link href="/settings" className="who" aria-label={`${t.settings}, ${user.email}`}>{user.email}</Link>
              <LogoutButton label={t.logout} />
            </>
          ) : (
            <Link href="/login">{t.login}</Link>
          )}
          <LangSwitch lang={lang} />
        </div>
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
        {t.kanji}: KANJIDIC2 · {t.dict}: JMdict · CC BY-SA 4.0 · <Link href="/legal">{t.legal}</Link>
      </p>
    </footer>
  );
}
