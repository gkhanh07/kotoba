import s from "./flashcards.module.css";

// Keyboard help beside the card on wide screens with a mouse; the CSS hides it where there is no keyboard.
export function KeyHelp({ title, keys }: { title: string; keys: [string, string][] }) {
  return (
    <div className={s.help}>
      <p className={s.helpTitle}>{title}</p>
      <dl>{keys.map(([key, what]) => <div key={key}><dt><kbd>{key}</kbd></dt><dd>{what}</dd></div>)}</dl>
    </div>
  );
}
