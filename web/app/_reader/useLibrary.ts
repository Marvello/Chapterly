import { useEffect, useState } from "react";
import type { LibraryNovel } from "@/lib/db";
import { idbStore } from "@/lib/reader/idb";
import { withPending } from "@/lib/reader/progress";

async function read(): Promise<LibraryNovel[]> {
  const store = idbStore();
  // The API returns full library rows; the store is typed with the reader's subset of them.
  const [lib, outbox] = await Promise.all([store.getLibrary() as Promise<LibraryNovel[] | undefined>, store.outbox()]);
  const pending = new Map(outbox.map(e => [e.novelId, e]));
  return Promise.all((lib ?? []).map(async n => pending.has(n.id) ? withPending(n, pending.get(n.id)!, await store.getToc(n.id)) : n));
}

/** The phone's cached library with this device's unsent progress applied (null until read); re-read whenever
 * `rev` changes (after each sync, and on leaving the reader). */
export function useLibrary(rev: number) {
  const [all, setAll] = useState<LibraryNovel[] | null>(null);
  useEffect(() => {
    let live = true;
    read().then(l => { if (live) setAll(l); }).catch(() => { if (live) setAll([]); });
    return () => { live = false; };
  }, [rev]);
  return all;
}
