"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { hideFromShelfAction } from "@/app/actions";
import type { LibraryNovel } from "@/lib/db";
import { continueReading, displayTitle } from "@/lib/view";
import Cover from "./Cover";
import ReaderLink from "./ReaderLink";

/** Recently read novels; each opens straight at the reader's saved chapter. Nothing when none is started.
 * Online, each has a ✕ that hides it (progress kept) until it's read further; `resync` refreshes the cached library. */
export default function ContinueShelf({ novels, online, resync }: { novels: LibraryNovel[]; online: boolean; resync: () => void }) {
  // Hidden here before the resync lands: id → read_at at the time, same rule as the server's.
  const [hiding, setHiding] = useState<ReadonlyMap<number, string | null>>(new Map());
  const shelf = continueReading(novels.map(n => hiding.has(n.id) ? { ...n, shelf_hidden_read_at: hiding.get(n.id)! } : n));
  if (shelf.length === 0) return null;

  const hide = async ({ id, read_at }: LibraryNovel) => {
    setHiding(m => new Map(m).set(id, read_at));   // gone at once; the resync makes it stick in the cached library
    try {
      await hideFromShelfAction(id);
      resync();
    } catch {
      setHiding(m => { const t = new Map(m); t.delete(id); return t; });
    }
  };

  return (
    <section aria-labelledby="continue-reading" className="mb-4">
      <h2 id="continue-reading" className="mb-2 text-sm font-medium text-tmuted">Continue reading</h2>
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {shelf.map(n => (
          <li key={n.id} className="relative w-20 shrink-0">
            <ReaderLink href={`/?novel=${n.id}&chapter=${n.progress_chapter_id}`} className="group block">
              <Cover url={n.cover_url} title={displayTitle(n)}
                className="aspect-[2/3] w-full rounded border border-edge text-[10px] group-hover:border-accent" />
              <p className="mt-1 line-clamp-2 text-xs leading-tight text-tprimary">{displayTitle(n)}</p>
              {!!n.unread && <p className="text-xs text-tmuted">{n.unread} unread</p>}
            </ReaderLink>
            {online && (
              <button type="button" onClick={() => hide(n)} title="Remove from Continue reading"
                aria-label={`Remove ${displayTitle(n)} from Continue reading`}
                className="absolute right-0.5 top-0.5 flex size-6 items-center justify-center rounded-full bg-page/85 text-tprimary shadow hover:text-accent">
                <X className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
