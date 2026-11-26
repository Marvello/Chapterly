import { expect, it } from "vitest";
import { appendBlock } from "./blocks";

const B = (id: number) => ({ id });

it("appends after the chapter it was loaded for, trimming the oldest past the cap", () => {
  expect(appendBlock([B(1), B(2)], 2, B(3), 5, new Set())).toEqual([B(1), B(2), B(3)]);
  expect(appendBlock([B(1), B(2), B(3)], 3, B(4), 3, new Set([1]))).toEqual([B(2), B(3), B(4)]);
});

it("never trims a chapter still on screen: short chapters grow the list instead of sliding through the novel", () => {
  expect(appendBlock([B(1), B(2), B(3)], 3, B(4), 3, new Set())).toEqual([B(1), B(2), B(3), B(4)]);
  expect(appendBlock([B(1), B(2), B(3), B(4)], 4, B(5), 3, new Set([1]))).toEqual([B(2), B(3), B(4), B(5)]);
});

it("drops a result that no longer fits: the list moved on while it was loading", () => {
  const prev = [B(9)];                                     // reader jumped to ch 9 while ch 11 loaded after ch 10
  expect(appendBlock(prev, 10, B(11), 5, new Set())).toBe(prev);
  const dup = [B(4), B(5)];
  expect(appendBlock(dup, 5, B(5), 5, new Set())).toBe(dup);         // never render a chapter twice
});
