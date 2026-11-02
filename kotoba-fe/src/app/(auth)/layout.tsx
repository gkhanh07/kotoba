import { SiteBar } from "../SiteBar";
import s from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteBar />
      <main className={s.auth}>
        <div className={s.panel}>{children}</div>
      </main>
    </>
  );
}
