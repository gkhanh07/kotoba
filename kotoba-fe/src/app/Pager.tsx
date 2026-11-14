import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { libraryText, listHref } from "@/lib/library";
import s from "./levels.module.css";

// Previous / next links and "Trang x / y". Renders nothing for a single page. `params` are the query params every link keeps.
export function Pager({ path, params, page, pages, lang }: { path: string; params: Record<string, string | number | undefined>; page: number; pages: number; lang: Lang }) {
  if (pages <= 1) return null;
  const t = libraryText[lang].levels;
  return (
    <nav className={s.pager} aria-label={t.pages}>
      {page > 1 ? <Link href={listHref(path, { ...params, page: page - 1 })} rel="prev">{t.prev}</Link> : <span aria-hidden="true" />}
      <p>{t.page(page, pages)}</p>
      {page < pages ? <Link href={listHref(path, { ...params, page: page + 1 })} rel="next">{t.next}</Link> : <span aria-hidden="true" />}
    </nav>
  );
}
