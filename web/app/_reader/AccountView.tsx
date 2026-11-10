"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Header from "@/components/Header";
import SignOutButton from "@/components/SignOutButton";
import { loadAccount, type Account } from "@/lib/reader/account";
import { online } from "@/lib/reader/online";
import { TAB_PAGE } from "@/lib/reader/tabs";
import { relativeTime, workerDown } from "@/lib/view";

/** Who's signed in, the app version and the worker's heartbeat. Offline it shows what this device last saw
 * and hides what needs the server (worker status, sign-out). */
export default function AccountView() {
  const isOnline = useSyncExternalStore(online.subscribe, online.get, online.getServer);
  const [acct, setAcct] = useState<Account | null>(null);
  useEffect(() => {
    let live = true;
    loadAccount(isOnline).then(a => { if (live && a) setAcct(a); });
    return () => { live = false; };
  }, [isOnline]);

  const down = acct && workerDown(acct.workerSeenAt, acct.tickMin);
  const rows: [string, React.ReactNode][] = acct ? [
    ["Name", acct.name || "—"],
    ["Email", acct.email],
    ["Sign-in", acct.signIn.join(", ") || "—"],
    ["Version", acct.version],
    ...(isOnline ? [["Worker", down
      ? <span className="text-warn">Not running (last seen {relativeTime(acct.workerSeenAt)})</span>
      : `Running, seen ${relativeTime(acct.workerSeenAt)}`] as [string, React.ReactNode]] : []),
  ] : [];

  return (
    <main className={TAB_PAGE}>
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 border-b border-edge bg-page px-4 pt-4">
        <Header tab="account" />
        {!isOnline && <p className="mb-4 text-sm text-tmuted">Offline: showing what this device last saw.</p>}
      </div>
      {acct && (
        <dl className="divide-y divide-edge rounded-xl border border-edge bg-component">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-4 px-4 py-3 text-sm">
              <dt className="w-20 shrink-0 text-tmuted">{k}</dt>
              <dd className="min-w-0 break-words text-tprimary">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {isOnline && <div className="mt-4"><SignOutButton full /></div>}
    </main>
  );
}
