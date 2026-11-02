"use client";
import Link from "next/link";
import { useActionState } from "react";
import { accountText, GOALS, MINUTES, type FormState } from "@/lib/account";
import type { Lang } from "@/lib/i18n";
import { forgot, login, register, saveOnboarding } from "./actions";
import s from "./auth.module.css";

const empty: FormState = { values: {} };

function Heading({ title, lede }: { title: string; lede: string }) {
  return (
    <>
      <h1>{title}</h1>
      <p className={s.lede}>{lede}</p>
    </>
  );
}

function Email({ label, value }: { label: string; value?: string }) {
  return (
    <label className={s.field}>
      <span>{label}</span>
      <input type="email" name="email" required autoComplete="email" defaultValue={value} />
    </label>
  );
}

function Password({ label, current }: { label: string; current?: boolean }) {
  return (
    <label className={s.field}>
      <span>{label}</span>
      <input type="password" name="password" required minLength={8} autoComplete={current ? "current-password" : "new-password"} />
    </label>
  );
}

// Native radios under a styled label: arrow keys and no-JS submit come for free.
function Choice({ name, legend, options, value }: { name: string; legend: string; options: { value: string; label: string }[]; value?: string }) {
  return (
    <fieldset className={s.choice}>
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o.value}>
          <input type="radio" name={name} value={o.value} defaultChecked={value === o.value} required className="sr-only" />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function Problem({ message }: { message?: string }) {
  return message ? <p role="alert" className={s.error}>{message}</p> : null;
}

const goalOptions = GOALS.map((g) => ({ value: g, label: g }));

export function LoginForm({ lang }: { lang: Lang }) {
  const t = accountText[lang];
  const [state, action, pending] = useActionState(login, empty);
  return (
    <>
      <Heading title={t.login.title} lede={t.login.lede} />
      <form action={action} className={s.form}>
        <Email label={t.email} value={state.values.email} />
        <Password label={t.password} current />
        <label className={s.check}>
          <input type="checkbox" name="remember" defaultChecked={state.values.remember} />
          {t.login.remember}
        </label>
        <Problem message={state.error && t.errors[state.error]} />
        <button type="submit" className="btn" disabled={pending}>{pending ? t.pending : t.login.submit}</button>
        <button type="button" className="btn btnGhost" disabled>{t.google}</button>
      </form>
      <p className={s.note}>{t.demo}</p>
      <p className={s.links}>
        <Link href="/forgot">{t.login.forgot}</Link>
        <Link href="/register">{t.login.register}</Link>
      </p>
    </>
  );
}

export function RegisterForm({ lang }: { lang: Lang }) {
  const t = accountText[lang];
  const [state, action, pending] = useActionState(register, empty);
  return (
    <>
      <Heading title={t.register.title} lede={t.register.lede} />
      <form action={action} className={s.form}>
        <Email label={t.email} value={state.values.email} />
        <Password label={t.password} />
        <Choice name="goal" legend={t.register.goal} options={goalOptions} value={state.values.goal} />
        <Problem message={state.error && t.errors[state.error]} />
        <button type="submit" className="btn" disabled={pending}>{pending ? t.pending : t.register.submit}</button>
        <button type="button" className="btn btnGhost" disabled>{t.google}</button>
      </form>
      <p className={s.note}>{t.demo}</p>
      <p className={s.links}>
        <Link href="/login">{t.register.login}</Link>
      </p>
    </>
  );
}

export function ForgotForm({ lang }: { lang: Lang }) {
  const t = accountText[lang];
  const [state, action, pending] = useActionState(forgot, empty);
  return (
    <>
      <Heading title={t.forgot.title} lede={t.forgot.lede} />
      {state.sent ? (
        <div role="status" className={s.form}>
          <p>{t.forgot.sent}</p>
          <p className={s.note}>{t.forgot.sentNote}</p>
        </div>
      ) : (
        <form action={action} className={s.form}>
          <Email label={t.email} value={state.values.email} />
          <Problem message={state.error && t.errors[state.error]} />
          <button type="submit" className="btn" disabled={pending}>{pending ? t.pending : t.forgot.submit}</button>
        </form>
      )}
      <p className={s.links}>
        <Link href="/login">{t.forgot.back}</Link>
      </p>
    </>
  );
}

export function OnboardingForm({
  lang,
  sessions,
  initial,
}: {
  lang: Lang;
  sessions: { value: string; label: string }[];
  initial: FormState["values"];
}) {
  const t = accountText[lang];
  const o = t.onboarding;
  const [state, action, pending] = useActionState(saveOnboarding, { values: initial });
  return (
    <>
      <Heading title={o.title} lede={o.lede} />
      <form action={action} className={s.form}>
        <label className={s.field}>
          <span>{o.name}</span>
          <input type="text" name="name" maxLength={40} autoComplete="given-name" defaultValue={state.values.name} />
        </label>
        <Choice name="goal" legend={o.goal} options={goalOptions} value={state.values.goal} />
        <label className={s.field}>
          <span>{o.exam}</span>
          <select name="exam" defaultValue={state.values.exam ?? "unknown"}>
            {sessions.map((x) => (
              <option key={x.value} value={x.value}>{x.label}</option>
            ))}
            <option value="unknown">{o.examUnknown}</option>
          </select>
        </label>
        <Choice
          name="minutes"
          legend={o.minutes}
          options={MINUTES.map((m) => ({ value: String(m), label: o.minutesUnit(m) }))}
          value={state.values.minutes}
        />
        <Problem message={state.error && t.errors[state.error]} />
        <button type="submit" className="btn" disabled={pending}>{pending ? t.pending : o.submit}</button>
      </form>
      <p className={s.links}>
        <Link href="/">{o.skip}</Link>
      </p>
    </>
  );
}
