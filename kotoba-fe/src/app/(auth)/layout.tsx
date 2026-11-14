import { SiteBar, SiteFooter } from "../SiteBar";
import s from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteBar />
      <main className={s.auth}>
        <div className={s.stage}>
          <div className={s.panel}>{children}</div>
          <Motif />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

// Decoration only (docs/tasks/ui-redesign.md AC-9.1): the brand word hung as a vertical shop sign
// beside the form. Hidden from assistive tech, and not drawn below 64rem where the form takes the width.
function Motif() {
  return (
    <div className={s.motif} aria-hidden="true">
      <div className={s.board}>
        <span lang="ja" className={s.sign}>言葉</span>
        <span lang="ja" className={s.reading}>ことば</span>
      </div>
    </div>
  );
}
