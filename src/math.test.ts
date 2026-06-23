import { expect, test } from "bun:test";
import { add, average, divide } from "./math";

test("add returns the sum", () => {
  expect(add(2, 3)).toBe(5);
});

test("divide returns the quotient", () => {
  expect(divide(8, 2)).toBe(4);
});

test("average returns the mean", () => {
  expect(average([2, 4, 6])).toBe(4);
  expect(average([7])).toBe(7);
  expect(average([-2, 0, 2])).toBe(0);
  expect(average([1, 2])).toBe(1.5);
});

test("average rejects empty lists", () => {
  expect(() => average([])).toThrow("Cannot average an empty list");
});
