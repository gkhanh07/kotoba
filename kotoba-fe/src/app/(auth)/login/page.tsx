import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLang } from "../../LangSwitch";
import { accountText, safePath } from "@/lib/account";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "../forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountText[await getLang()].login.title + " · Kotoba" };
}

export default async function LoginPage(props: PageProps<"/login">) {
  const next = safePath((await props.searchParams).next);
  if (await currentUser()) redirect(next);
  return <LoginForm lang={await getLang()} next={next === "/" ? undefined : next} />;
}
