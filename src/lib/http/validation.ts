export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
