import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLang } from "../../LangSwitch";
import { accountText, isGoal } from "@/lib/account";
import { currentUser } from "@/lib/auth";
import { RegisterForm } from "../forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountText[await getLang()].register.title + " · Kotoba" };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  if (await currentUser()) redirect("/");
  const goal = `N${(await searchParams).level}`;
  return <RegisterForm lang={await getLang()} goal={isGoal(goal) ? goal : undefined} />;
}
