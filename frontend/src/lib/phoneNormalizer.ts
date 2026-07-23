export interface ParseResult {
  total: number;
  valid: string[];
  invalid: string[];
  duplicates: string[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
}

/**
 * Smart formats phone numbers to standard format (e.g., 919876543210)
 */
export function smartFormatPhone(raw: string, defaultCode: string = '91'): string {
  if (!raw) return '';

  // Step 1: Remove all non-digit characters
  let cleaned = raw.replace(/\D/g, '');
  const cleanCode = defaultCode.replace(/\D/g, '') || '91';

  // Step 2: Handle various formats
  if (cleaned.length === 10) {
    // Pure 10-digit: 9876543210 -> 919876543210
    cleaned = cleanCode + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // 11-digit starting with 0: 09876543210 -> 919876543210
    cleaned = cleanCode + cleaned.substring(1);
  } else if (cleaned.length === 13 && cleaned.startsWith('091')) {
    // 0919876543210 -> 919876543210
    cleaned = cleaned.substring(1);
  } else if (cleaned.length === 14 && cleaned.startsWith('0091')) {
    // 00919876543210 -> 919876543210
    cleaned = cleaned.substring(2);
  }

  // Step 3: Validate final length (10 to 15 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return '';
  }

  return cleaned;
}

/**
 * Parses raw text input into valid/invalid/duplicate phone number arrays
 */
export function parseNumbersFromText(text: string, defaultCode: string = '91'): ParseResult {
  if (!text) {
    return {
      total: 0,
      valid: [],
      invalid: [],
      duplicates: [],
      validCount: 0,
      invalidCount: 0,
      duplicateCount: 0,
    };
  }

  const rawNumbers = text
    .split(/[\n,;\s\t]+/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  const valid: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawNumbers) {
    const formatted = smartFormatPhone(raw, defaultCode);

    if (!formatted) {
      invalid.push(raw);
      continue;
    }

    if (seen.has(formatted)) {
      duplicates.push(raw);
      continue;
    }

    seen.add(formatted);
    valid.push(formatted);
  }

  return {
    total: rawNumbers.length,
    valid,
    invalid,
    duplicates,
    validCount: valid.length,
    invalidCount: invalid.length,
    duplicateCount: duplicates.length,
  };
}
