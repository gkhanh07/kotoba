import Link from "next/link";
import { getLang, LangSwitch } from "./LangSwitch";
import { dict } from "@/lib/i18n";
import { currentUser } from "@/lib/auth";
import { LogoutButton } from "./Sync";
import { MenuNav } from "./MenuNav";

export function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9h11M9.5 4.5 14 9l-4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
    </svg>
  );
}

const LIBRARY = ["kana", "flashcards"] as const;
// Primary items (lessons, review, search, test) join as their routes ship.
type Current = (typeof LIBRARY)[number];

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
        <button type="button" className="libraryBtn" popoverTarget="site-library" data-current={(LIBRARY as readonly string[]).includes(current ?? "") ? "" : undefined}>
          {t.library}
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3.5 5 7.5 9 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
        <div id="site-library" popover="auto" className="library">
          <Link href="/kana" aria-current={here("kana")}>{t.kana}</Link>
          <Link href="/flashcards" aria-current={here("flashcards")}>{t.flashcards}</Link>
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
