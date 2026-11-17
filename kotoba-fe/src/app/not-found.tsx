import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "./LangSwitch";
import { dict } from "@/lib/i18n";
import { Arrow, SiteBar, SiteFooter } from "./SiteBar";

export async function generateMetadata(): Promise<Metadata> {
  return { title: dict(await getLang()).notFound.title };
}

export default async function NotFound() {
  const t = dict(await getLang()).notFound;
  return (
    <>
      <SiteBar />
      <main className="statusPage">
        <h1 className="statusMark">404</h1>
        <p>{t.body}</p>
        <Link href="/" className="btn">{t.home} <Arrow /></Link>
      </main>
      <SiteFooter />
    </>
  );
}
