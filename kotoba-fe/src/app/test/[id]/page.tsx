import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTest } from "@/lib/content";
import { testText } from "@/lib/testText";
import { getLang } from "../../LangSwitch";
import { SiteBar, SiteFooter } from "../../SiteBar";
import { TestApp } from "./TestApp";

export async function generateMetadata(props: PageProps<"/test/[id]">): Promise<Metadata> {
  const [lang, { id }] = await Promise.all([getLang(), props.params]);
  const paper = await getTest(id);
  return paper ? { title: `${paper.title[lang]} · ${testText[lang].title} · Kotoba` } : {};
}

export default async function TestPage(props: PageProps<"/test/[id]">) {
  const [lang, { id }] = await Promise.all([getLang(), props.params]);
  const paper = await getTest(id);
  if (!paper) notFound();
  return (
    <>
      <SiteBar current="test" />
      <TestApp paper={paper} lang={lang} />
      <SiteFooter />
    </>
  );
}
