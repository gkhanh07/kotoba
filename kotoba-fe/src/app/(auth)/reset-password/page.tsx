import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLang } from "../../LangSwitch";
import { accountText } from "@/lib/account";
import { ResetForm } from "../forms";

export async function generateMetadata(): Promise<Metadata> {
  // The token sits in this page's URL; keep it out of Referer headers.
  return { title: accountText[await getLang()].reset.title + " · Kotoba", referrer: "no-referrer" };
}

export default async function ResetPage(props: PageProps<"/reset-password">) {
  const { token } = await props.searchParams;
  if (typeof token !== "string" || !token) redirect("/forgot");
  return <ResetForm lang={await getLang()} token={token} />;
}
