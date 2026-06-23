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
  if (values.length === 0) {
    throw new Error("Cannot average an empty list");
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
