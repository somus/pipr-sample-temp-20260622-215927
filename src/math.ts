export function add(left: number, right: number): number {
  return left + right;
}

export function divide(left: number, right: number): number {
  if (right === 0) {
    throw new Error("Cannot divide by zero");
  }
  return left / right;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, max), min);
}
