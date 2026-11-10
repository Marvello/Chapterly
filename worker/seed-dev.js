// Dev only: fill a NEW database with a login and some novels, so the web UI can be looked at without scraping.
//   node worker/seed-dev.js <new-db-file>      then: CHAPTERLY_DB=<that file> npm run dev   (in web/)
// Refuses to touch an existing file. Sign in with EMAIL / PASSWORD below.
"use strict";
const fs = require("node:fs");
const bcrypt = require("bcryptjs");
const { openDb } = require("../shared/db.js");

const EMAIL = "dev@example.com", PASSWORD = "chapterly-dev-only";
const file = process.argv[2];
if (!file) throw new Error("usage: node worker/seed-dev.js <new-db-file>");
if (fs.existsSync(file)) throw new Error(`${file} already exists; seed-dev only fills a new database`);

const db = openDb(file);
const user = db.createUser({ email: EMAIL, name: "Dev Reader", passwordHash: bcrypt.hashSync(PASSWORD, 10) });
const daysAgo = d => new Date(Date.now() - d * 86_400_000).toISOString();
// title, author, chapters, current chapter (1-based; 0 = not started), last read (days ago), extra
const NOVELS = [
  ["The Lantern Road", "Mira Okafor", 40, 28, 1],
  ["Salt and Cinder", "J. R. Halloway", 25, 20, 3],
  ["A Quiet Orbit", "Tomas Verhoeven", 60, 12, 8],
  ["Clockmaker's Daughter of the Ninth Canal District", "Ines Abara", 120, 97, 2],
  ["Harbor of Glass", "Mira Okafor", 15, 15, 0.2, { series: "completed" }],
  ["The Ninth Ledger", "P. Sandoval", 30, 30, 5],
  ["Moss Kingdom", "Lena Fairweather", 18, 18, 12],
  ["Unopened Atlas", "Tomas Verhoeven", 10, 0, 0],
  ["Winter Engines", "Dao Minh", 75, 0, 0],
  ["The Cartographer's Apprentice", "Ines Abara", 44, 0, 0, { series: "completed" }],
  ["Paper Tigers", "Sam Oyelaran", 22, 0, 0, { paused: true }],
  ["Signal Fires", "Lena Fairweather", 33, 0, 0, { error: "TOC fetch timed out after 120 s" }],
  ["Low Tide Almanac", "P. Sandoval", 8, 0, 0, { series: "dropped" }],
  ["Glass Orchard", "Dao Minh", 51, 0, 0],
];
NOVELS.forEach(([title, author, total, current, read, extra = {}], i) => {
  const base = `https://example.com/novel/${i + 1}`;
  const n = db.addNovel(base);
  db.updateNovelMeta(n.id, { parser: null, title, author, language: "en", subjects: null, cover: null,
    description: `${title}: a seeded novel for looking at the interface. Nothing here was scraped.` });
  db.addChapters(n.id, Array.from({ length: total }, (_, k) => ({ index: k, url: `${base}/${k + 1}`, title: `Chapter ${k + 1}` })));
  const chapters = db.chapters(n.id);
  for (const c of chapters) db.saveChapter(c.id, `<p>${`This is seeded text for ${title}, ${c.title}. `.repeat(120)}</p>`, 999);
  db.markCheckStarted(n.id);
  db.markCheckDone(n.id, extra.error ?? null);
  if (extra.series) db.setSeriesStatus(n.id, extra.series);
  if (extra.paused) db.setStatus(n.id, "paused");
  if (current) db.saveProgress(user.id, { novelId: n.id, chapterId: chapters[current - 1].id, fraction: 0.4, readAt: daysAgo(read), force: true });
});
db.heartbeat();
db.close();
console.log(`Seeded ${NOVELS.length} novels into ${file}. Login: see EMAIL / PASSWORD in worker/seed-dev.js`);
