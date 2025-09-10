export function prettyDate(date?: string | null, locale?: string): string {
  if (!date) return "";
  // Handle plain YYYY-MM-DD safely in local time to avoid timezone shifts
  const parts = date.split("-").map((n) => Number(n));
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    const [y, m, d] = parts;
    return new Date(y, m - 1, d).toLocaleDateString(locale);
  }
  // Fallback: try native Date parsing
  const dt = new Date(date);
  return Number.isNaN(dt.getTime()) ? date : dt.toLocaleDateString(locale);
}

