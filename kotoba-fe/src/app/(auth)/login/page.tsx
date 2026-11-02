import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLang } from "../../LangSwitch";
import { accountText } from "@/lib/account";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "../forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountText[await getLang()].login.title + " · Kotoba" };
}

export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  return <LoginForm lang={await getLang()} />;
}
