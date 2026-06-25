import { expect, test } from "bun:test";
import { add, divide, multiply } from "./math";

test("add returns the sum", () => {
  expect(add(2, 3)).toBe(5);
});

test("divide returns the quotient", () => {
  expect(divide(8, 2)).toBe(4);
});

test("multiply returns the product", () => {
  expect(multiply(4, 5)).toBe(20);
});
