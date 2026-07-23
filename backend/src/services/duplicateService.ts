import { PhoneNormalizer } from '../utils/phoneNormalizer.js';
import { BlacklistNumber } from '../models/BlacklistNumber.js';
import { Contact } from '../models/Contact.js';

export interface DuplicateReport {
  totalContacts: number;
  uniqueCount: number;
  duplicateCount: number;
  invalidCount: number;
  blacklistedCount: number;
  uniqueContacts: any[];
  duplicates: Array<{
    normalizedPhone: string;
    occurrences: number;
    entries: any[];
  }>;
  invalidNumbers: any[];
  blacklistedNumbers: any[];
}

export class DuplicateDetector {
  /**
   * Scans a contact list for duplicates, invalid phone numbers, and blacklisted entries
   */
  static async detectInList(contacts: any[], options: { checkBlacklist?: boolean } = {}): Promise<DuplicateReport> {
    const seenMap = new Map<string, any[]>();
    const invalidNumbers: any[] = [];
    const blacklistedNumbers: any[] = [];

    const blacklistedSet = new Set(
      (await BlacklistNumber.find({}, 'phone')).map((b) => b.phone)
    );

    for (const c of contacts) {
      const rawPhone = typeof c === 'string' ? c : c.phone || c.mobile || '';
      const normalized = PhoneNormalizer.normalize(rawPhone);

      if (!normalized) {
        invalidNumbers.push({ contact: c, reason: 'Invalid phone format' });
        continue;
      }

      if (options.checkBlacklist !== false && blacklistedSet.has(normalized)) {
        blacklistedNumbers.push({ contact: c, phone: normalized, reason: 'Blacklisted number' });
        continue;
      }

      if (!seenMap.has(normalized)) {
        seenMap.set(normalized, []);
      }
      seenMap.get(normalized)!.push({ ...c, phone: normalized });
    }

    const uniqueContacts: any[] = [];
    const duplicates: any[] = [];

    seenMap.forEach((entries, normalizedPhone) => {
      uniqueContacts.push(entries[0]);
      if (entries.length > 1) {
        duplicates.push({
          normalizedPhone,
          occurrences: entries.length,
          entries,
        });
      }
    });

    return {
      totalContacts: contacts.length,
      uniqueCount: uniqueContacts.length,
      duplicateCount: duplicates.length,
      invalidCount: invalidNumbers.length,
      blacklistedCount: blacklistedNumbers.length,
      uniqueContacts,
      duplicates,
      invalidNumbers,
      blacklistedNumbers,
    };
  }

  /**
   * Applies selected deduplication strategy ('keep_first' | 'keep_latest' | 'merge')
   */
  static handleDuplicates(duplicates: any[], strategy: 'keep_first' | 'keep_latest' | 'merge') {
    return duplicates.map((group) => {
      if (strategy === 'keep_latest') {
        return group.entries[group.entries.length - 1];
      } else if (strategy === 'merge') {
        return this.mergeContactData(group.entries);
      }
      return group.entries[0]; // keep_first
    });
  }

  /**
   * Merges multiple duplicate records into a single complete contact record
   */
  static mergeContactData(entries: any[]) {
    const base = { ...entries[0] };
    for (const entry of entries) {
      if (!base.name && entry.name) base.name = entry.name;
      if (!base.email && entry.email) base.email = entry.email;
      if (!base.city && entry.city) base.city = entry.city;
      if (!base.company && entry.company) base.company = entry.company;
      base.customFields = { ...(base.customFields || {}), ...(entry.customFields || {}) };
    }
    return base;
  }
}
