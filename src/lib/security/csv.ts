/**
 * Sanitizes a single cell value to prevent CSV / Spreadsheet formula injection.
 * Prepends a single quote if the value starts with risky characters: =, +, -, @, \t, \r
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let stringValue = String(value);

  // Check if string starts with formula trigger character
  if (/^[=+\-@\t\r]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }

  // Escape inner double quotes by doubling them
  const escaped = stringValue.replace(/"/g, '""');

  return `"${escaped}"`;
}

/**
 * Converts an array of objects to safe CSV format.
 */
export function generateSafeCsv<T extends Record<string, unknown>>(
  headers: ReadonlyArray<{ key: keyof T; label: string }>,
  rows: T[]
): string {
  const headerLine = headers.map((h) => sanitizeCsvCell(h.label)).join(',');
  const rowLines = rows.map((row) =>
    headers.map((h) => sanitizeCsvCell(row[h.key])).join(',')
  );

  return [headerLine, ...rowLines].join('\r\n');
}
