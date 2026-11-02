"use server";
import { redirect } from "next/navigation";
import { currentUser, saveProfile, signIn, signOut, signUp } from "@/lib/auth";
import { isEmail, isExam, isGoal, isMinutes, isName, PASSWORD_MIN, type FormState } from "@/lib/account";

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

// Native input attributes catch most mistakes first; these re-check on the server.
export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").trim();
  const password = text(form, "password");
  const remember = form.get("remember") === "on";
  const values = { email, remember };
  if (!isEmail(email)) return { error: "email", values };
  if (password.length < PASSWORD_MIN) return { error: "password", values };
  const { onboarded } = await signIn(email, password, remember);
  redirect(onboarded ? "/" : "/onboarding");
}

export async function register(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").trim();
  const password = text(form, "password");
  const goal = text(form, "goal");
  const values = { email, goal };
  if (!isEmail(email)) return { error: "email", values };
  if (password.length < PASSWORD_MIN) return { error: "password", values };
  if (!isGoal(goal)) return { error: "goal", values };
  await signUp(email, password, goal);
  redirect("/onboarding");
}

export async function forgot(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").trim();
  if (!isEmail(email)) return { error: "email", values: { email } };
  // ponytail: no mail is sent; the same reply for any email, so it never reveals which have accounts. Call the BE here later.
  return { sent: true, values: { email } };
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
  await saveProfile({ email: user.email, name: name || undefined, goal, exam, minutes });
  redirect("/");
}

export async function logout() {
  await signOut();
  redirect("/");
}
