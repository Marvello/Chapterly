import { cookies } from "next/headers";
import { currentUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { UID_COOKIE } from "@/lib/reader/account";
import { json, libraryRows } from "@/lib/reader/api";
import { newSince } from "@/lib/view";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return json({ status: 401, body: { error: "unauthorized" } });
  (await cookies()).set(UID_COOKIE, String(uid), {
    path: "/", sameSite: "lax", maxAge: 400 * 86400, secure: (process.env.AUTH_URL ?? "").startsWith("https:"),
  });
  const db = getDb();
  return json({ status: 200, body: libraryRows(db.listNovels(newSince()), db.readerLibrary(uid)) });
}
