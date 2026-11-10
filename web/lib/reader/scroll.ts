/** Chapter blocks in document coordinates, top to bottom. */
export type ScrollBlock = { chapterId: number; idx: number; top: number; height: number };

/** The chapter at the top of the viewport and how far through it the reader is. `atEnd` = the page is scrolled
 * to its very bottom: that is the end of the last chapter, fraction 1 (which the top of the viewport alone never
 * reaches, least of all in a chapter shorter than the screen). lib/view readingList relies on it. */
export function positionFromScroll(blocks: ScrollBlock[], scrollTop: number, atEnd = false) {
  const last = blocks.at(-1);
  if (atEnd && last) return { chapterId: last.chapterId, idx: last.idx, fraction: 1 };
  const b = blocks.find(x => scrollTop < x.top + x.height) ?? blocks.at(-1);
  if (!b) return null;
  const fraction = b.height > 0 ? Math.min(1, Math.max(0, (scrollTop - b.top) / b.height)) : 0;
  return { chapterId: b.chapterId, idx: b.idx, fraction };
}
