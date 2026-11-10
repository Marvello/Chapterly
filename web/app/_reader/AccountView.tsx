"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Header from "@/components/Header";
import SignOutButton from "@/components/SignOutButton";
import { loadAccount, type Account } from "@/lib/reader/account";
import { idbStore } from "@/lib/reader/idb";
import { online } from "@/lib/reader/online";
import { offlineStatus } from "@/lib/reader/sync";
import { TAB_PAGE } from "@/lib/reader/tabs";
import { fetchBacklog, pct, relativeTime, workerDown } from "@/lib/view";
import { useLibrary } from "./useLibrary";

const num = (n: number) => n.toLocaleString();

/** Who's signed in, the app version, the worker's heartbeat, and how complete things are: what the server has
 * fetched of every novel, and what this phone has saved of the chapters it keeps offline (both from the phone's
 * own data, re-read after each sync: `rev`). Offline it shows what this device last saw and hides what needs
 * the server (worker status, sign-out). */
export default function AccountView({ rev }: { rev: number }) {
  const isOnline = useSyncExternalStore(online.subscribe, online.get, online.getServer);
  const [acct, setAcct] = useState<Account | null>(null);
  useEffect(() => {
    let live = true;
    loadAccount(isOnline).then(a => { if (live && a) setAcct(a); });
    return () => { live = false; };
  }, [isOnline]);

  const library = useLibrary(rev);
  const [phone, setPhone] = useState<{ wanted: number; have: number; bytes: number | null } | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([offlineStatus(idbStore()), navigator.storage?.estimate?.().catch(() => undefined)])
      .then(([o, est]) => { if (live) setPhone({ ...o, bytes: est?.usage ?? null }); })
      .catch(() => {});   // no IndexedDB (blocked upgrade, private mode): the row just stays out
    return () => { live = false; };
  }, [rev]);

  const server = library?.length ? fetchBacklog(library) : null;
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
  if (server) {
    const left = server.total - server.fetched;
    rows.push(["On server", <>
      {num(server.fetched)} of {num(server.total)} chapters fetched ({pct(server.fetched, server.total)}%)
      <span className="block text-tmuted">
        {left > 0 ? `${num(left)} still to fetch` : "Nothing left to fetch"}{server.failing > 0 && `, ${num(server.failing)} failing`}
      </span>
    </>]);
  }
  if (phone) {
    const left = phone.wanted - phone.have;
    rows.push(["On this phone", <>
      {phone.wanted ? `${num(phone.have)} of ${num(phone.wanted)} chapters saved for offline (${pct(phone.have, phone.wanted)}%)`
        : "Nothing to save yet: start reading or download a novel"}
      <span className="block text-tmuted">
        {phone.wanted > 0 && (left > 0 ? `${num(left)} still to download` : "Nothing left to download")}
        {phone.bytes != null && `${phone.wanted > 0 ? ", " : ""}${(phone.bytes / 1_048_576).toFixed(1)} MB used`}
      </span>
    </>]);
  }

  return (
    <main className={TAB_PAGE}>
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 border-b border-edge bg-page px-4 pt-4">
        <Header tab="account" />
        {!isOnline && <p className="mb-4 text-sm text-tmuted">Offline: showing what this device last saw.</p>}
      </div>
      {rows.length > 0 && (
        <dl className="divide-y divide-edge rounded-xl border border-edge bg-component">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-4 px-4 py-3 text-sm">
              <dt className="w-24 shrink-0 text-tmuted">{k}</dt>
              <dd className="min-w-0 break-words text-tprimary">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {isOnline && <div className="mt-4"><SignOutButton full /></div>}
    </main>
  );
}
