import { currentUserId } from "@/lib/auth";
import { readAuthConfig } from "@/lib/authConfig";
import { getDb } from "@/lib/db";
import type { Account } from "@/lib/reader/account";
import { json } from "@/lib/reader/api";

export async function GET() {
  const uid = await currentUserId();
  const db = getDb();
  const u = uid ? db.getUserById(uid) : undefined;
  if (!u) return json({ status: 401, body: { error: "unauthorized" } });
  const cfg = readAuthConfig();
  const body: Account = {
    name: u.name, email: u.email,
    // The ways this account can sign in (not which one this session used).
    signIn: [cfg.passwordLogin ? "Password" : "", cfg.oidc && u.oidc_sub ? cfg.oidc.name : ""].filter(Boolean),
    version: (process.env.CHAPTERLY_VERSION || "dev").slice(0, 7),   // the image's commit (web/Dockerfile GIT_SHA)
    workerSeenAt: db.workerSeenAt(), tickMin: Number(process.env.CHAPTERLY_TICK_MIN || 1),
  };
  return json({ status: 200, body });
}
