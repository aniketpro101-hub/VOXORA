import { parsePhoneNumberWithError, CountryCode } from 'libphonenumber-js';

export class PhoneNormalizer {
  /**
   * Standardizes any raw phone input to E.164 without leading plus (e.g. 919876543210)
   */
  static normalize(rawPhone: any, defaultCountry: CountryCode = 'IN'): string | null {
    if (!rawPhone) return null;
    const str = String(rawPhone).trim();

    try {
      const parsed = parsePhoneNumberWithError(str, defaultCountry);
      if (parsed && parsed.isValid()) {
        return parsed.number.replace('+', '');
      }
    } catch (e) {
      // Fallback manual regex normalization
      const digits = str.replace(/[^0-9]/g, '');
      if (digits.length === 10) return `91${digits}`;
      if (digits.length === 12 && digits.startsWith('91')) return digits;
      if (digits.length > 8 && digits.length <= 15) return digits;
    }

    const cleaned = str.replace(/[^0-9]/g, '');
    return cleaned.length >= 8 ? cleaned : null;
  }

  /**
   * Detailed validation and formatting breakdown
   */
  static validate(phone: string, defaultCountry: CountryCode = 'IN') {
    try {
      const parsed = parsePhoneNumberWithError(phone, defaultCountry);
      const isValid = parsed.isValid();
      const normalized = parsed.number.replace('+', '');

      return {
        valid: isValid,
        normalized,
        countryCode: parsed.countryCallingCode,
        nationalNumber: parsed.nationalNumber,
        format: parsed.formatInternational(),
        reason: isValid ? undefined : 'Invalid number format',
      };
    } catch (error: any) {
      const normalized = this.normalize(phone, defaultCountry);
      return {
        valid: Boolean(normalized),
        normalized: normalized || '',
        countryCode: '91',
        nationalNumber: phone,
        format: phone,
        reason: error.message || 'Parse error',
      };
    }
  }

  /**
   * Detects landline patterns
   */
  static isPossiblyLandline(phone: string): boolean {
    const digits = phone.replace(/[^0-9]/g, '');
    // Indian landline area code patterns (e.g., 022, 011, 080 + 8 digits = 10-11 digits starting with 0)
    if (digits.startsWith('022') || digits.startsWith('011') || digits.startsWith('080')) return true;
    if (digits.length === 10 && (digits.startsWith('22') || digits.startsWith('11') || digits.startsWith('80'))) return true;
    return false;
  }

  /**
   * Returns country metadata based on calling code
   */
  static detectCountry(phone: string): { code: string; name: string; emoji: string } {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('91')) return { code: '91', name: 'India', emoji: '🇮🇳' };
    if (clean.startsWith('1')) return { code: '1', name: 'USA / Canada', emoji: '🇺🇸' };
    if (clean.startsWith('44')) return { code: '44', name: 'United Kingdom', emoji: '🇬🇧' };
    if (clean.startsWith('971')) return { code: '971', name: 'UAE', emoji: '🇦🇪' };
    if (clean.startsWith('966')) return { code: '966', name: 'Saudi Arabia', emoji: '🇸🇦' };
    return { code: '91', name: 'International', emoji: '🌐' };
  }

  /**
   * Formats for display
   */
  static formatDisplay(phone: string, style: 'international' | 'national' | 'e164' = 'international'): string {
    const norm = this.normalize(phone);
    if (!norm) return phone;
    if (style === 'e164') return `+${norm}`;
    if (style === 'international' && norm.startsWith('91')) {
      return `+91 ${norm.substring(2, 7)} ${norm.substring(7)}`;
    }
    return norm;
  }
}
