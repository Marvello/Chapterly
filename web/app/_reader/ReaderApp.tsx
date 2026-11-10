"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { runSync } from "@/lib/reader/client";
import { IdbBlockedError } from "@/lib/reader/idb";
import { online, unreachable } from "@/lib/reader/online";
import { AuthError } from "@/lib/reader/sync";
import { lastTab, parseTab } from "@/lib/reader/tabs";
import { parseId } from "@/lib/validate";
import AccountView from "./AccountView";
import LibraryView from "./LibraryView";
import NovelView from "./NovelView";
import ReadingHome from "./ReadingHome";
import ReadingView from "./ReadingView";

// Reading home, library, account + reader in one page: views switch by query string (?tab=, ?novel=, &chapter=)
// via pushState, so the
// service worker can serve the whole thing offline as one cached page.
export default function ReaderApp() {
  const params = useSearchParams();
  const router = useRouter();
  const routerRef = useRef(router);   // the router object changes with the URL; keep sync stable
  useEffect(() => { routerRef.current = router; });
  const novelId = parseId(params.get("novel") ?? "");
  const chapterId = parseId(params.get("chapter") ?? "");
  const tab = parseTab(params.get("tab"));
  useEffect(() => { if (!novelId) lastTab.set(tab); }, [tab, novelId]);   // a novel's "back" returns here
  const [rev, setRev] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const sync = useCallback(() => {
    if (!navigator.onLine) return;
    runSync()
      .then(r => {
        online.setReachable(true);
        setNotice(r.quotaExceeded ? "Phone storage is full, so downloading stopped."
          : r.progressError ? `Reading progress couldn't be saved to the server (${r.progressError}); it will retry.` : null);
        setRev(v => v + 1);
      })
      .catch(e => {
        if (e instanceof AuthError) return routerRef.current.replace("/login");
        // Can't reach the server: show the offline library. (Another server error still means it's there.)
        const reachable = !unreachable(e);
        online.setReachable(reachable);
        setNotice(!reachable ? null   // offline: the page says so
          : e instanceof IdbBlockedError ? e.message : "Sync failed; it will retry when you come back.");
      });
  }, []);

  // Leaving the reader: its last position is saved by now, so re-read the lists (works offline: unsent progress
  // is applied on the phone), and sync for what only the server knows.
  const left = useCallback(() => { setRev(v => v + 1); sync(); }, [sync]);

  useEffect(() => {
    navigator.serviceWorker?.register("/sw.js").catch(() => {});
    const onVisible = () => { if (document.visibilityState === "visible") sync(); };
    sync();
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sync]);

  if (novelId && chapterId) return <ReadingView key={novelId} novelId={novelId} chapterId={chapterId} onLeave={left} />;
  if (novelId) return <NovelView novelId={novelId} rev={rev} />;
  if (tab === "account") return <AccountView rev={rev} />;
  if (tab === "library") return <LibraryView rev={rev} notice={notice} resync={sync} />;
  return <ReadingHome rev={rev} notice={notice} resync={sync} />;
}
