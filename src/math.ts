export function add(left: number, right: number): number {
  return left + right;
}

export function divide(left: number, right: number): number {
  if (right === 0) {
    throw new Error("Cannot divide by zero");
  }
  return left / right;
}

export function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

// pipr recipe smoke: plugin-tool-review
