import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLang } from "../../LangSwitch";
import { accountText } from "@/lib/account";
import { currentUser } from "@/lib/auth";
import { RegisterForm } from "../forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountText[await getLang()].register.title + " · Kotoba" };
}

export default async function RegisterPage() {
  if (await currentUser()) redirect("/");
  return <RegisterForm lang={await getLang()} />;
}
