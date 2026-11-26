// The Account tab's data. Kept in localStorage (not IndexedDB: tiny, and no schema bump) so the tab still
// shows who's signed in and the app version offline; sign-out clears it.
export interface Account {
  name: string | null; email: string; signIn: string[]; version: string;
  workerSeenAt: string | null; tickMin: number;
}
const KEY = "chapterly-account";

/** Signed-in user id, readable by the page: the library request sets it, sign-out deletes it. Unsent progress is
 * stamped with it when queued and the server refuses any other user's, so progress left behind by a sign-out
 * (a save racing it, another tab) is never applied to the next account on the device. */
export const UID_COOKIE = "chapterly-uid";
export function queuedUid(): number | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${UID_COOKIE}=(\\d+)`));
  return m ? Number(m[1]) : null;
}

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
