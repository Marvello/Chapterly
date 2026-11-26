/**
 * Add a loaded chapter to the reading view's list. `afterId` is the chapter it was loaded to follow:
 * if the list moved on while it loaded (a jump to another chapter, or it's already there), the result
 * is dropped — appending it anyway would skip or repeat a chapter. Past `max`, the oldest are trimmed, but only
 * those in `above` (scrolled off the top): trimming one still on screen moves the reading spot, and with chapters
 * shorter than the screen the list would slide on by itself to the end of the novel.
 */
export function appendBlock<T extends { id: number }>(prev: T[], afterId: number, b: T, max: number,
  above: ReadonlySet<number>): T[] {
  if (prev.at(-1)?.id !== afterId || prev.some(x => x.id === b.id)) return prev;
  const next = [...prev, b];
  let drop = 0;
  while (next.length - drop > max && above.has(next[drop].id)) drop++;
  return next.slice(drop);
}
