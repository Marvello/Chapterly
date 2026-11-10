"use client";

import { BookOpen, CircleUser, LibraryBig } from "lucide-react";
import { TABS, tabHref, type Tab } from "@/lib/reader/tabs";
import ReaderLink from "./ReaderLink";

const ICONS = { reading: BookOpen, library: LibraryBig, account: CircleUser };

/** Reading / Library / Account. One nav: a bar fixed to the bottom of a phone (thumb reach), plain links in
 * the header from `sm` up. Pages that show it need bottom padding on a phone (`pb-24 sm:pb-4`). */
export default function TabBar({ tab }: { tab: Tab }) {
  return (
    <nav aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-edge bg-component pb-[env(safe-area-inset-bottom)] sm:static sm:gap-1 sm:border-0 sm:bg-transparent sm:pb-0">
      {(Object.keys(TABS) as Tab[]).map(t => {
        const Icon = ICONS[t];
        return (
          <ReaderLink key={t} href={tabHref(t)} aria-current={t === tab ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs sm:flex-none sm:flex-row sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1 sm:text-sm ${
              t === tab ? "font-medium text-accent" : "text-tmuted hover:text-tprimary"}`}>
            <Icon className="size-5 sm:size-4" /> {TABS[t]}
          </ReaderLink>
        );
      })}
    </nav>
  );
}
