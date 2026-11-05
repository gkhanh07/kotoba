// Browser storage for the mock test: the in-progress attempt (sessionStorage) and the saved results (localStorage).
// Every access is guarded; blocked or full storage degrades to "nothing saved", never an exception.
import { TEST_RESULTS_BACKUP_KEY, TEST_RESULTS_KEY, TEST_SESSION_PREFIX } from "@/config/test";
import { parseResults, parseSession, type Result, type Results, type Session } from "./test";

const sessionKey = (id: string) => TEST_SESSION_PREFIX + id;

export function readSession(id: string): Session | null {
  try {
    return parseSession(sessionStorage.getItem(sessionKey(id)));
  } catch {
    return null; // storage blocked
  }
}

export function writeSession(id: string, session: Session): boolean {
  try {
    sessionStorage.setItem(sessionKey(id), JSON.stringify(session));
    return true;
  } catch {
    return false; // full or blocked: the attempt continues in memory
  }
}

export function clearSession(id: string): void {
  try {
    sessionStorage.removeItem(sessionKey(id));
  } catch {
    return; // nothing to clear when storage is blocked
  }
}

// The first stored attempt that parses, for the dashboard's resume link.
export function findSession(): { id: string; session: Session } | null {
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith(TEST_SESSION_PREFIX)) continue;
      const session = parseSession(sessionStorage.getItem(key));
      if (session) return { id: key.slice(TEST_SESSION_PREFIX.length), session };
    }
  } catch {
    return null;
  }
  return null;
}

export function readResults(): Results {
  try {
    return parseResults(localStorage.getItem(TEST_RESULTS_KEY)) ?? {};
  } catch {
    return {};
  }
}

// Latest result wins per paper. A stored value that does not parse is copied to the backup key before it is replaced.
export function saveResult(id: string, result: Result): boolean {
  try {
    const raw = localStorage.getItem(TEST_RESULTS_KEY);
    const known = parseResults(raw);
    if (raw && !known) localStorage.setItem(TEST_RESULTS_BACKUP_KEY, raw);
    localStorage.setItem(TEST_RESULTS_KEY, JSON.stringify({ ...known, [id]: result }));
    return true;
  } catch {
    return false;
  }
}
