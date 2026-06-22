export function add(left: number, right: number): number {
  return left + right;
}

export function divide(left: number, right: number): number {
  if (right === 0) {
    throw new Error("Cannot divide by zero");
  }
  return left / right;
}
