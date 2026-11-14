"use client";
import { useActionState, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { accountText, MINUTES, type FormState } from "@/lib/account";
import type { Lang } from "@/lib/i18n";
import { clearLocal } from "@/lib/store";
import { newPassword, removeAccount, saveSettings, setLang } from "../(auth)/actions";
import { Choice, empty, flag, goalOptions, Heading, Password, Problem } from "../(auth)/forms";
import a from "../(auth)/auth.module.css";
import s from "./settings.module.css";

type Props = { lang: Lang; email: string; sessions: { value: string; label: string }[]; initial: FormState["values"] };

// Four forms, each saving on its own with its own result line.
export function SettingsForms({ lang, email, sessions, initial }: Props) {
  const t = accountText[lang];
  return (
    <main className={a.auth}>
      <div className={`${a.panel} ${s.panel}`}>
        <Heading title={t.settings.title} lede={t.settings.lede(email)} />
        {/* Two columns on desktop: what you study on the left, the account on the right. */}
        <div className={s.columns}>
          <div className={s.column}>
            <Profile lang={lang} sessions={sessions} initial={initial} />
            <Language lang={lang} />
          </div>
          <div className={s.column}>
            <NewPassword lang={lang} email={email} />
            <Data lang={lang} />
            <Remove lang={lang} />
          </div>
        </div>
      </div>
    </main>
  );
}

function Profile({ lang, sessions, initial }: Omit<Props, "email">) {
  const t = accountText[lang];
  const o = t.onboarding;
  const [state, action, pending] = useActionState(saveSettings, { values: initial });
  const problem = useId();
  // The save stays off until something changes; a submit settles it again, unless it failed.
  const [dirty, setDirty] = useState(false);
  return (
    <section className={s.section} aria-labelledby="set-profile">
      <h2 id="set-profile">{t.settings.profile}</h2>
      <form action={action} className={a.form} onInput={() => setDirty(true)} onSubmit={() => setDirty(false)}>
        <label className={a.field}>
          <span>{t.settings.name}</span>
          <input type="text" name="name" maxLength={40} autoComplete="given-name" defaultValue={state.values.name} {...flag(state.error, "name", problem)} />
        </label>
        <Choice name="goal" legend={o.goal} options={goalOptions} value={state.values.goal} describedBy={state.error === "goal" ? problem : undefined} />
        <label className={a.field}>
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
        <div className={s.row}>
          <button type="submit" className="btn" disabled={pending || (!dirty && !state.error)}>{pending ? t.pending : t.settings.save}</button>
          <Saved at={state.at} text={t.settings.saved} />
        </div>
      </form>
    </section>
  );
}

// Fades after 4s (settings.module.css); keyed by the save time so each save shows it again.
function Saved({ at, text }: { at?: number; text: string }) {
  return (
    <p role="status" className={s.saved}>
      {at && <span key={at}>{text}</span>}
    </p>
  );
}

function Language({ lang }: { lang: Lang }) {
  const t = accountText[lang].settings;
  return (
    <section className={s.section} aria-labelledby="set-lang">
      <h2 id="set-lang">{t.lang}</h2>
      {/* Same cookie as the VI|EN switch in the bar; a pick submits at once. */}
      <form action={setLang} className={a.form}>
        <fieldset className={a.choice}>
          <legend className="sr-only">{t.lang}</legend>
          {([["vi", "Tiếng Việt"], ["en", "English"]] as const).map(([v, label]) => (
            <label key={v}>
              <input
                type="radio"
                name="lang"
                value={v}
                lang={v}
                defaultChecked={lang === v}
                className="sr-only"
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
              />
              <span lang={v}>{label}</span>
            </label>
          ))}
        </fieldset>
        <p className={a.note}>{t.langNote}</p>
      </form>
    </section>
  );
}

function NewPassword({ lang, email }: { lang: Lang; email: string }) {
  const t = accountText[lang];
  const [state, action, pending] = useActionState(newPassword, empty);
  const problem = useId();
  return (
    <section className={s.section} aria-labelledby="set-password">
      <h2 id="set-password">{t.settings.password}</h2>
      <form action={action} className={a.form}>
        {/* Lets password managers file the change under the right account. */}
        <input type="email" name="username" autoComplete="username" value={email} hidden readOnly />
        <Password name="current" label={t.settings.current} current invalid={flag(state.error, "current", problem)} />
        <Password label={t.settings.next} invalid={flag(state.error, "password", problem)} />
        <Problem id={problem} message={state.error && t.errors[state.error]} />
        <div className={s.row}>
          <button type="submit" className="btn btnGhost" disabled={pending}>{pending ? t.pending : t.settings.change}</button>
          <p role="status" className={a.note}>{state.sent && t.settings.changed}</p>
        </div>
      </form>
    </section>
  );
}

// A plain link: the route handler answers with an attachment, so the page stays where it is.
function Data({ lang }: { lang: Lang }) {
  const t = accountText[lang].settings;
  return (
    <section className={s.section} aria-labelledby="set-data">
      <h2 id="set-data">{t.data}</h2>
      <p className={a.lede}>{t.dataBody}</p>
      <a href="/settings/export" className={`btn btnGhost ${s.download}`}>{t.download}</a>
    </section>
  );
}

function Remove({ lang }: { lang: Lang }) {
  const t = accountText[lang];
  const router = useRouter();
  // Wiped here, not in an effect: the deleted session re-renders /settings into a sign-in redirect first.
  const [state, action, pending] = useActionState(async (prev: FormState, form: FormData) => {
    const r = await removeAccount(prev, form);
    if (r.sent) {
      clearLocal(); // the account is gone; progress on this device goes with it
      router.replace("/");
    }
    return r;
  }, empty);
  const dialog = useRef<HTMLDialogElement>(null);
  const problem = useId();
  return (
    <section className={s.section} data-danger aria-labelledby="set-remove">
      <h2 id="set-remove">{t.settings.remove}</h2>
      <p className={a.lede}>{t.settings.removeBody}</p>
      <button type="button" className={`btn btnGhost ${s.danger}`} onClick={() => dialog.current?.showModal()}>
        {t.settings.removeOpen}
      </button>
      <dialog ref={dialog} className={s.dialog} aria-labelledby="remove-title">
        <h2 id="remove-title">{t.settings.removeTitle}</h2>
        <p className={a.lede}>{t.settings.removeAsk}</p>
        <form action={action} className={a.form}>
          <Password label={t.password} current invalid={flag(state.error, "current", problem)} />
          <Problem id={problem} message={state.error && t.errors[state.error]} />
          <div className={s.row}>
            <button type="submit" className={`btn btnGhost ${s.danger}`} disabled={pending || state.sent}>
              {pending ? t.pending : t.settings.removeConfirm}
            </button>
            <button type="button" className="btn btnGhost" onClick={() => dialog.current?.close()}>{t.settings.cancel}</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
