import { expect, it } from "vitest";
import { parseTab, tabHref } from "./tabs";

it("parseTab: unknown or missing falls back to reading; tabHref round-trips", () => {
  expect([null, "", "nope", "library", "account"].map(parseTab)).toEqual(["reading", "reading", "reading", "library", "account"]);
  for (const t of ["reading", "library", "account"] as const) expect(parseTab(new URL(tabHref(t), "http://x").searchParams.get("tab"))).toBe(t);
});
