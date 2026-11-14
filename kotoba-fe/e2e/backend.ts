// Stops and restarts the real kotoba-be for the sync-status journey (phase 20). page.route cannot fake an
// outage: the browser never calls kotoba-be, the Next server does. Same database and port as playwright.config.ts.
import { execFileSync, spawn } from "node:child_process";
import { resolve } from "node:path";

export const BE_PORT = 4000;
const BE_URL = `http://127.0.0.1:${BE_PORT}/content/kana`;
// Playwright runs from kotoba-fe (npm run test:e2e), like the specs that read ../kotoba-be/content.
const BE_DIR = resolve(process.cwd(), "../kotoba-be");
const POLL_MS = 200;
const POLL_TRIES = 100; // 20 s

// Windows has no lsof/ps (BUG-008); `exit 0` because an empty Get-NetTCPConnection is an error there.
const WINDOWS_LISTENERS =
  `Get-NetTCPConnection -State Listen -LocalPort ${BE_PORT} -ErrorAction SilentlyContinue | ` +
  `Select-Object -ExpandProperty OwningProcess -Unique | ` +
  `Where-Object { (Get-CimInstance Win32_Process -Filter "ProcessId=$_").CommandLine -like '*dist?main*' }; exit 0`;

// Only kotoba-be's own Node process on the port: never some other program that happens to listen there.
function listeners(): number[] {
  if (process.platform === "win32") {
    const out = execFileSync("powershell", ["-NoProfile", "-Command", WINDOWS_LISTENERS], { encoding: "utf8" });
    return out.split(/\r?\n/).filter(Boolean).map(Number);
  }
  let pids: number[];
  try {
    pids = execFileSync("lsof", ["-ti", `tcp:${BE_PORT}`, "-sTCP:LISTEN"], { encoding: "utf8" }).split("\n").filter(Boolean).map(Number);
  } catch {
    return []; // lsof exits 1 when nothing listens
  }
  return pids.filter((pid) => execFileSync("ps", ["-o", "args=", "-p", String(pid)], { encoding: "utf8" }).includes("dist/main"));
}

async function waitFor(up: boolean) {
  for (let i = 0; i < POLL_TRIES; i++) {
    const ok = await fetch(BE_URL).then((r) => r.ok, () => false);
    if (ok === up) return;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error(`kotoba-be did not go ${up ? "up" : "down"} on :${BE_PORT}`);
}

export async function stopBackend() {
  for (const pid of listeners()) process.kill(pid, "SIGTERM");
  await waitFor(false);
}

// The built app, without `nest start` and its migrate step: the database is already migrated.
export async function startBackend() {
  const child = spawn(process.execPath, ["dist/main"], {
    cwd: BE_DIR,
    env: { ...process.env, DATABASE_URL: "file:./e2e.db", PORT: String(BE_PORT) },
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  await waitFor(true);
}

// globalTeardown: a backend restarted by a test is not Playwright's child, so stop it here.
export default function teardown() {
  for (const pid of listeners()) process.kill(pid, "SIGTERM");
}
