// The Account tab's data. Kept in localStorage (not IndexedDB: tiny, and no schema bump) so the tab still
// shows who's signed in and the app version offline; sign-out clears it.
export interface Account {
  name: string | null; email: string; signIn: string[]; version: string;
  workerSeenAt: string | null; tickMin: number;
}
const KEY = "chapterly-account";

export function cachedAccount(): Account | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
}
export function clearAccount() {
  try { localStorage.removeItem(KEY); } catch { /* nothing stored */ }
}
/** From the server when it's reachable (and remembered), else what this device last saw. */
export async function loadAccount(useServer: boolean): Promise<Account | null> {
  if (!useServer) return cachedAccount();
  try {
    const res = await fetch("/api/reader/account");
    if (!res.ok) return cachedAccount();
    const a = await res.json() as Account;
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* not remembered */ }
    return a;
  } catch { return cachedAccount(); }
}
