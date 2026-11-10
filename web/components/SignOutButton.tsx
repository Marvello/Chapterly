"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { clearAccount } from "@/lib/reader/account";
import { deleteReaderDb } from "@/lib/reader/idb";

/** Clears this device's reader data (library, chapters, unsent progress, account info) before signing out.
 * `full`: a labelled button (Account tab) instead of the header's small link. */
export default function SignOutButton({ full = false }: { full?: boolean }) {
  return (
    <form action={async () => { clearAccount(); await deleteReaderDb(); await signOutAction(); }}>
      <button aria-label="Sign out" className={full
        ? "flex items-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm text-tprimary"
        : "flex items-center gap-1 text-sm text-tmuted hover:text-tprimary"}>
        <LogOut className="size-4" /> <span className={full ? "" : "hidden sm:inline"}>Sign out</span>
      </button>
    </form>
  );
}
