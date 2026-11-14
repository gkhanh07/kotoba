"use client";
import Link from "next/link";
import { useActionState, useId } from "react";
import { accountText, GOALS, isInvalidField, MINUTES, type ErrorCode, type FormState } from "@/lib/account";
import type { Lang } from "@/lib/i18n";
import { forgot, login, register, reset, saveOnboarding } from "./actions";
import s from "./auth.module.css";

export const empty: FormState = { values: {} };

export function Heading({ title, lede }: { title: string; lede: string }) {
  return (
    <>
      <h1>{title}</h1>
      <p className={s.lede}>{lede}</p>
    </>
  );
}

// Points a field at its form's error line when the error is about it: the border changes and the
// line is read with the field, so the state is never colour alone (docs/tasks/ui-redesign.md AC-9.2).
export const flag = (error: ErrorCode | undefined, field: string, problemId: string) =>
  isInvalidField(error, field) ? { "aria-invalid": true as const, "aria-describedby": problemId } : {};
type Flag = ReturnType<typeof flag>;

function Email({ label, value, invalid }: { label: string; value?: string; invalid?: Flag }) {
  return (
    <label className={s.field}>
      <span>{label}</span>
      <input type="email" name="email" required autoComplete="email" defaultValue={value} {...invalid} />
    </label>
  );
}

export function Password({ label, current, name = "password", invalid }: { label: string; current?: boolean; name?: string; invalid?: Flag }) {
  return (
    <label className={s.field}>
      <span>{label}</span>
      <input type="password" name={name} required minLength={8} autoComplete={current ? "current-password" : "new-password"} {...invalid} />
    </label>
  );
}

// Native radios under a styled label: arrow keys and no-JS submit come for free.
// describedBy points the group at the form's problem line when the error is this group's;
// no aria-invalid, which ARIA 1.2 drops on a plain group.
export function Choice({ name, legend, options, value, describedBy }: { name: string; legend: string; options: { value: string; label: string }[]; value?: string; describedBy?: string }) {
  return (
    <fieldset className={s.choice} aria-describedby={describedBy}>
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

export function Problem({ id, message }: { id?: string; message?: string }) {
  return message ? <p id={id} role="alert" className={s.error}>{message}</p> : null;
}

export const goalOptions = GOALS.map((g) => ({ value: g, label: g }));

export function LoginForm({ lang, next }: { lang: Lang; next?: string }) {
  const t = accountText[lang];
  const [state, action, pending] = useActionState(login, empty);
  const problem = useId();
  return (
    <>
      {/* A redirect from a page that needs an account says so, rather than "logging in is optional" (BUG-025). */}
      <Heading title={t.login.title} lede={next ? t.login.needed : t.login.lede} />
      <form action={action} className={s.form}>
        {next && <input type="hidden" name="next" value={next} />}
        <Email label={t.email} value={state.values.email} invalid={flag(state.error, "email", problem)} />
        <Password label={t.password} current invalid={flag(state.error, "password", problem)} />
        <label className={s.check}>
          <input type="checkbox" name="remember" defaultChecked={state.values.remember} />
          {t.login.remember}
        </label>
        <Problem id={problem} message={state.error && t.errors[state.error]} />
        <button type="submit" className="btn" disabled={pending}>{pending ? t.pending : t.login.submit}</button>
        <button type="button" className="btn btnGhost" disabled>{t.google}</button>
      </form>
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
  const problem = useId();
  return (
    <>
      <Heading title={t.register.title} lede={t.register.lede} />
      <form action={action} className={s.form}>
        <Email label={t.email} value={state.values.email} invalid={flag(state.error, "email", problem)} />
        <Password label={t.password} invalid={flag(state.error, "password", problem)} />
        <Choice name="goal" legend={t.register.goal} options={goalOptions} value={state.values.goal} describedBy={state.error === "goal" ? problem : undefined} />
        <Problem id={problem} message={state.error && t.errors[state.error]} />
        <button type="submit" className="btn" disabled={pending}>{pending ? t.pending : t.register.submit}</button>
        <button type="button" className="btn btnGhost" disabled>{t.google}</button>
      </form>
      <p className={s.links}>
        <Link href="/login">{t.register.login}</Link>
      </p>
    </>
  );
}

export function ForgotForm({ lang }: { lang: Lang }) {
  const t = accountText[lang];
  const [state, action, pending] = useActionState(forgot, empty);
  const problem = useId();
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
          <Email label={t.email} value={state.values.email} invalid={flag(state.error, "email", problem)} />
          <Problem id={problem} message={state.error && t.errors[state.error]} />
          <button type="submit" className="btn" disabled={pending}>{pending ? t.pending : t.forgot.submit}</button>
        </form>
      )}
      <p className={s.links}>
        <Link href="/login">{t.forgot.back}</Link>
      </p>
    </>
  );
}

export function ResetForm({ lang, token }: { lang: Lang; token: string }) {
  const t = accountText[lang];
  const [state, action, pending] = useActionState(reset, { values: { token } });
  const problem = useId();
  return (
    <>
      <Heading title={t.reset.title} lede={t.reset.lede} />
      {state.sent ? (
        <div role="status" className={s.form}>
          <p>{t.reset.done}</p>
          <Link href="/login" className="btn">{t.reset.login}</Link>
        </div>
      ) : (
        <form action={action} className={s.form}>
          <input type="hidden" name="token" value={token} />
          <Password label={t.reset.password} invalid={flag(state.error, "password", problem)} />
          <Problem id={problem} message={state.error && t.errors[state.error]} />
          <button type="submit" className="btn" disabled={pending}>{pending ? t.pending : t.reset.submit}</button>
        </form>
      )}
      {!state.sent && (
        <p className={s.links}>
          {state.error === "token" ? <Link href="/forgot">{t.reset.again}</Link> : <Link href="/login">{t.forgot.back}</Link>}
        </p>
      )}
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
  const problem = useId();
  return (
    <>
      <Heading title={o.title} lede={o.lede} />
      <form action={action} className={s.form}>
        <label className={s.field}>
          <span>{o.name}</span>
          <input type="text" name="name" maxLength={40} autoComplete="given-name" defaultValue={state.values.name} {...flag(state.error, "name", problem)} />
        </label>
        <Choice name="goal" legend={o.goal} options={goalOptions} value={state.values.goal} describedBy={state.error === "goal" ? problem : undefined} />
        <label className={s.field}>
          <span>{o.exam}</span>
          <select name="exam" defaultValue={state.values.exam ?? "unknown"} {...flag(state.error, "exam", problem)}>
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
          describedBy={state.error === "minutes" ? problem : undefined}
        />
        <Problem id={problem} message={state.error && t.errors[state.error]} />
        <button type="submit" className="btn" disabled={pending}>{pending ? t.pending : o.submit}</button>
      </form>
      <p className={s.links}>
        <Link href="/">{o.skip}</Link>
      </p>
    </>
  );
}
