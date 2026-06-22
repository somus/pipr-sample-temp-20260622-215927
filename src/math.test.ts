import { expect, test } from "bun:test";
import { add, divide } from "./math";

test("add returns the sum", () => {
  expect(add(2, 3)).toBe(5);
});

test("divide returns the quotient", () => {
  expect(divide(8, 2)).toBe(4);
});
