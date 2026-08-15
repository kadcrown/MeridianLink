import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, generateSafeCsv } from '@/lib/security/csv';

describe('CSV Injection Sanitizer', () => {
  it('escapes formulas starting with =, +, -, @, tab, newline', () => {
    expect(sanitizeCsvCell('=SUM(1+1)')).toBe(`"'=SUM(1+1)"`);
    expect(sanitizeCsvCell('+12345')).toBe(`"'+12345"`);
    expect(sanitizeCsvCell('-500')).toBe(`"'-500"`);
    expect(sanitizeCsvCell('@cmd|calc')).toBe(`"'@cmd|calc"`);
    expect(sanitizeCsvCell('\tmalicious')).toBe(`"'\tmalicious"`);
  });

  it('escapes internal double quotes properly', () => {
    expect(sanitizeCsvCell('Sony "WH-1000XM5" Headset')).toBe('"Sony ""WH-1000XM5"" Headset"');
  });

  it('generates complete safe CSV table', () => {
    const headers = [
      { key: 'link', label: 'Link Title' },
      { key: 'clicks', label: 'Clicks' },
      { key: 'formula', label: 'Formula Test' },
    ] as const;

    const rows = [
      { link: 'Sony Headphones', clicks: 120, formula: 'Safe Value' },
      { link: 'Apple AirPods', clicks: 85, formula: '=10+20' },
    ];

    const csv = generateSafeCsv(headers, rows);
    expect(csv).toContain('"Link Title","Clicks","Formula Test"');
    expect(csv).toContain('"Sony Headphones","120","Safe Value"');
    expect(csv).toContain('"Apple AirPods","85","\'=10+20"');
  });
});
