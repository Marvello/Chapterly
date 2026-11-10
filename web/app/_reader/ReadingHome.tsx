"use client";

import { useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { hideFromShelfAction } from "@/app/actions";
import Cover from "@/components/Cover";
import Header from "@/components/Header";
import ReaderLink from "@/components/ReaderLink";
import type { LibraryNovel } from "@/lib/db";
import { online } from "@/lib/reader/online";
import { TAB_PAGE, tabHref } from "@/lib/reader/tabs";
import { displayTitle, pct, readProgress, readingList, relativeTime } from "@/lib/view";
import { useLibrary } from "./useLibrary";

const resume = (n: LibraryNovel) => `/?novel=${n.id}&chapter=${n.progress_chapter_id}`;
/** Position among the fetched chapters, as the reader's top bar counts it. */
const position = (n: LibraryNovel) => n.chapters_fetched - (n.unread ?? 0);
const pill = "rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-page";
const section = "mb-1 mt-6 text-xs font-medium uppercase tracking-wide text-tmuted";

/** Home: the novels you're reading (lib/view readingList), from the phone's cached library, each opening at the
 * saved chapter. The one to pick up next is a large card, the rest rows, caught-up ones quieter at the bottom.
 * Online, ✕ hides a novel (progress kept) until it's read further; `resync` refreshes the cached library. */
export default function ReadingHome({ rev, notice, resync }: { rev: number; notice: string | null; resync: () => void }) {
  const all = useLibrary(rev);
  const isOnline = useSyncExternalStore(online.subscribe, online.get, online.getServer);
  // Hidden here before the resync lands: id → read_at at the time, same rule as the server's.
  const [hiding, setHiding] = useState<ReadonlyMap<number, string | null>>(new Map());
  const { unread, caughtUp } = readingList((all ?? []).map(n => hiding.has(n.id) ? { ...n, shelf_hidden_read_at: hiding.get(n.id)! } : n));
  const [hero, ...next] = unread;

  const hide = async ({ id, read_at }: LibraryNovel) => {
    setHiding(m => new Map(m).set(id, read_at));   // gone at once; the resync makes it stick in the cached library
    try {
      await hideFromShelfAction(id);
      resync();
    } catch {
      setHiding(m => { const t = new Map(m); t.delete(id); return t; });
    }
  };
  const hideButton = (n: LibraryNovel, className: string) => isOnline && (
    <button type="button" onClick={() => hide(n)} title="Remove from Reading" aria-label={`Remove ${displayTitle(n)} from Reading`}
      className={`grid size-9 shrink-0 place-items-center rounded-full text-tmuted hover:text-accent ${className}`}>
      <X className="size-4" />
    </button>
  );
  const rows = (list: LibraryNovel[], dim = false) => (
    <ul className="divide-y divide-edge">
      {list.map(n => (
        <li key={n.id} className="flex items-center gap-1">
          <ReaderLink href={resume(n)} className="group flex min-w-0 flex-1 items-center gap-3 py-2.5">
            <Cover url={n.cover_url} title={displayTitle(n)} className={`h-[4.5rem] w-12 shrink-0 rounded border border-edge text-[8px] group-hover:border-accent ${dim ? "opacity-60" : ""}`} />
            <div className="min-w-0 flex-1">
              {/* Caught up: quieter by colour and weight, not opacity (text stays ≥ 4.5:1). */}
              <p className={`line-clamp-2 font-serif leading-snug ${dim ? "text-tsecondary" : "font-semibold text-tprimary"}`}>{displayTitle(n)}</p>
              <p className="text-xs text-tmuted">
                {dim ? "Waiting for new chapters" : `Chapter ${position(n)} of ${n.chapters_fetched}`} · read {relativeTime(n.read_at)}
              </p>
            </div>
            {!!n.unread && <span className={pill} aria-label={`${n.unread} unread`}>{n.unread}</span>}
          </ReaderLink>
          {hideButton(n, "")}
        </li>
      ))}
    </ul>
  );

  return (
    <main className={TAB_PAGE}>
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 border-b border-edge bg-page px-4 pt-4">
        <Header tab="reading" />
        {!isOnline && <p className="mb-4 text-sm text-tmuted">Offline: showing the novels saved on this device.</p>}
      </div>
      {notice && <p className="mb-3 rounded-lg border border-warn px-3 py-2 text-sm text-warn">{notice}</p>}
      {/* Not during the very first sync, when the phone has no library yet. */}
      {all !== null && !hero && !(rev === 0 && isOnline && all.length === 0) && (
        <p className="text-tmuted">
          {caughtUp.length ? "All caught up. New chapters will show up here."
            : <>Nothing in progress yet. Start a novel from the <ReaderLink href={tabHref("library")} className="text-accent underline">Library</ReaderLink>.</>}
        </p>
      )}
      {hero && (
        <div className="relative">
          <ReaderLink href={resume(hero)} className="flex gap-4 rounded-xl border border-edge bg-component p-4 hover:border-accent">
            <Cover url={hero.cover_url} title={displayTitle(hero)} className="h-40 w-[6.67rem] shrink-0 rounded border border-edge text-xs" />
            <div className="flex min-w-0 flex-1 flex-col">
              <h2 className="line-clamp-3 pr-6 font-serif text-xl font-semibold leading-tight text-tprimary">{displayTitle(hero)}</h2>
              <p className="mt-1 text-sm text-tmuted">Chapter {position(hero)} of {hero.chapters_fetched} · {pct(readProgress(hero), 1)}%</p>
              {/* No unread chapters = the newest one is open but not read to its end (lib/view hasMoreToRead). */}
              <p className="mt-1.5">{hero.unread ? <span className={pill}>{hero.unread} unread</span>
                : <span className="text-sm text-tsecondary">Finishing the latest chapter</span>}</p>
              <div className="mt-3 h-1 rounded bg-edge" aria-hidden>
                <div className="h-full rounded bg-accent" style={{ width: `${readProgress(hero) * 100}%` }} />
              </div>
              <span className="mt-auto self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-page">Continue</span>
            </div>
          </ReaderLink>
          {hideButton(hero, "absolute right-1 top-1")}
        </div>
      )}
      {next.length > 0 && <><h2 className={section}>Up next</h2>{rows(next)}</>}
      {caughtUp.length > 0 && <><h2 className={section}>Caught up</h2>{rows(caughtUp, true)}</>}
    </main>
  );
}
