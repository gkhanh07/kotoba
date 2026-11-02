import type { Metadata } from "next";
import { getLang } from "../../LangSwitch";
import { accountText } from "@/lib/account";
import { ForgotForm } from "../forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountText[await getLang()].forgot.title + " · Kotoba" };
}

export default async function ForgotPage() {
  return <ForgotForm lang={await getLang()} />;
}
