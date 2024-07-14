export function convertToUUID(str: string): string {
  if (str.length !== 32) {
    throw new Error("Input string must be 32 characters long")
  }
  return `${str.slice(0, 8)}-${str.slice(8, 12)}-${str.slice(
    12,
    16
  )}-${str.slice(16, 20)}-${str.slice(20)}`
}
