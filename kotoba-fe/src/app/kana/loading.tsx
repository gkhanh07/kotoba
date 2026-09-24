import { getLang } from "../LangSwitch";
import { dict } from "@/lib/i18n";
import s from "./kana.module.css";

export default async function Loading() {
  return (
    <div className={s.status} role="status">
      <span lang="ja" className={s.statusSign}>かな</span>
      <p>{dict(await getLang()).status.loading}</p>
    </div>
  );
}
