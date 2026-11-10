import { useEffect, useState } from "react";
import type { LibraryNovel } from "@/lib/db";
import { idbStore } from "@/lib/reader/idb";

/** The phone's cached library (null until read); re-read whenever `rev` changes (after each sync). */
export function useLibrary(rev: number) {
  const [all, setAll] = useState<LibraryNovel[] | null>(null);
  useEffect(() => {
    let live = true;
    // The API returns full library rows; the store is typed with the reader's subset of them.
    idbStore().getLibrary().then(l => { if (live) setAll((l ?? []) as LibraryNovel[]); });
    return () => { live = false; };
  }, [rev]);
  return all;
}
