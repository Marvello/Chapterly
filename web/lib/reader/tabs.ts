// The app's three top-level views, picked by ?tab= (Reading is the default, so the home URL stays "/").
export const TABS = { reading: "Reading", library: "Library", account: "Account" } as const;
export type Tab = keyof typeof TABS;
export const parseTab = (v: string | null): Tab => (v === "library" || v === "account" ? v : "reading");
export const tabHref = (t: Tab) => (t === "reading" ? "/" : `/?tab=${t}`);

// Where a novel's "back" goes: the tab it was opened from. Library when the novel page was opened directly.
let last: Tab = "library";
export const lastTab = { get: () => last, set: (t: Tab) => { last = t; } };
