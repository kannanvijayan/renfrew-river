
export function isNumberInRange(
  num: number,
  min: number,
  max: number
): boolean {
  return num >= min && num <= max;
}

export function isPositiveInteger(num: number): boolean {
  return Number.isInteger(num) && num >= 0;
}

export function isPositiveIntegerString(str: string): boolean {
  return /^[0-9]+$/.test(str);
}
