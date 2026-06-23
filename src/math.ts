export function add(left: number, right: number): number {
  return left + right;
}

export function divide(left: number, right: number): number {
  if (right === 0) {
    throw new Error("Cannot divide by zero");
  }
  return left / right;
}

export function firstNonEmpty(values: string[]): string | undefined {
  return values.find((value) => value.trim().length > 0);
}

export function lastValue<T>(values: T[]): T | undefined {
  return values.at(-1);
}
