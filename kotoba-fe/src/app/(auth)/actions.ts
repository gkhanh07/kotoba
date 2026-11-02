"use server";
import { redirect } from "next/navigation";
import { currentUser, requestReset, resetPassword, saveProfile, signIn, signOut, signUp } from "@/lib/auth";
import { isEmail, isExam, isGoal, isMinutes, isName, PASSWORD_MIN, type FormState } from "@/lib/account";

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

// Native input attributes catch most mistakes first; these re-check on the server, and the BE checks again.
export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").trim();
  const password = text(form, "password");
  const remember = form.get("remember") === "on";
  const values = { email, remember };
  if (!isEmail(email)) return { error: "email", values };
  if (password.length < PASSWORD_MIN) return { error: "password", values };
  const r = await signIn(email, password, remember);
  if ("error" in r) return { error: r.error, values };
  redirect(r.onboarded ? "/" : "/onboarding");
}

export async function register(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").trim();
  const password = text(form, "password");
  const goal = text(form, "goal");
  const values = { email, goal };
  if (!isEmail(email)) return { error: "email", values };
  if (password.length < PASSWORD_MIN) return { error: "password", values };
  if (!isGoal(goal)) return { error: "goal", values };
  const { error } = await signUp(email, password, goal);
  if (error) return { error, values };
  redirect("/onboarding");
}

export async function forgot(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").trim();
  if (!isEmail(email)) return { error: "email", values: { email } };
  await requestReset(email);
  return { sent: true, values: { email } };
}

export async function reset(_prev: FormState, form: FormData): Promise<FormState> {
  const token = text(form, "token");
  const password = text(form, "password");
  const values = { token };
  if (password.length < PASSWORD_MIN) return { error: "password", values };
  const { error } = await resetPassword(token, password);
  if (error) return { error, values };
  return { sent: true, values: {} };
}

export async function saveOnboarding(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const name = text(form, "name").trim();
  const goal = text(form, "goal");
  const exam = text(form, "exam");
  const minutes = Number(text(form, "minutes"));
  const values = { name, goal, exam, minutes: text(form, "minutes") };
  if (name && !isName(name)) return { error: "name", values };
  if (!isGoal(goal)) return { error: "goal", values };
  if (!isExam(exam)) return { error: "exam", values };
  if (!isMinutes(minutes)) return { error: "minutes", values };
  await saveProfile({ name: name || null, goal, exam, minutes });
  redirect("/");
}

export async function logout() {
  await signOut();
  redirect("/");
}
