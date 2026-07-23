import * as XLSX from 'xlsx';
import { Contact, IContact } from '../models/Contact.js';
import { BlacklistNumber } from '../models/BlacklistNumber.js';
import { logger } from '../utils/logger.js';

export interface ColumnMapping {
  phone: string;
  name?: string;
  email?: string;
  city?: string;
  company?: string;
  [key: string]: string | undefined;
}

export class ImportService {
  /**
   * Reads an uploaded Excel or CSV file buffer and returns raw rows and headers
   */
  static parseExcel(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const jsonRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    const headers = jsonRows.length > 0 ? Object.keys(jsonRows[0]) : [];

    return {
      headers,
      totalRows: jsonRows.length,
      previewRows: jsonRows.slice(0, 10),
      rawRows: jsonRows,
    };
  }

  /**
   * Normalizes raw phone strings to standard WhatsApp format (digits only, e.g. 919876543210)
   */
  static normalizePhoneNumber(rawPhone: any): string {
    if (!rawPhone) return '';
    const digits = String(rawPhone).replace(/[^0-9]/g, '');
    if (digits.length === 10) return `91${digits}`; // Default to India 91 if 10 digits
    return digits;
  }

  /**
   * Validates rows, checks duplicates and blacklist numbers
   */
  static async validateImportData(rows: Record<string, any>[], mapping: ColumnMapping) {
    const validRows: any[] = [];
    const duplicateRows: any[] = [];
    const invalidRows: any[] = [];
    const blacklistedRows: any[] = [];

    const phoneKey = mapping.phone;
    if (!phoneKey) {
      throw new Error('Phone column mapping is required');
    }

    const blacklistedPhones = new Set(
      (await BlacklistNumber.find({}, 'phone')).map((b) => b.phone)
    );
    const existingPhones = new Set(
      (await Contact.find({}, 'phone')).map((c) => c.phone)
    );
    const seenInBatch = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawPhone = row[phoneKey];
      const normalizedPhone = this.normalizePhoneNumber(rawPhone);

      const contactObj = {
        phone: normalizedPhone,
        name: mapping.name ? String(row[mapping.name] || '').trim() : '',
        email: mapping.email ? String(row[mapping.email] || '').trim() : '',
        city: mapping.city ? String(row[mapping.city] || '').trim() : '',
        company: mapping.company ? String(row[mapping.company] || '').trim() : '',
        customFields: {} as Record<string, string>,
        rowNumber: i + 2,
      };

      // Map extra custom fields
      Object.keys(mapping).forEach((key) => {
        if (!['phone', 'name', 'email', 'city', 'company'].includes(key) && mapping[key]) {
          contactObj.customFields[key] = String(row[mapping[key]!] || '').trim();
        }
      });

      if (!normalizedPhone || normalizedPhone.length < 8) {
        invalidRows.push({ ...contactObj, reason: 'Invalid phone number format' });
      } else if (blacklistedPhones.has(normalizedPhone)) {
        blacklistedRows.push({ ...contactObj, reason: 'Number is blacklisted' });
      } else if (existingPhones.has(normalizedPhone) || seenInBatch.has(normalizedPhone)) {
        duplicateRows.push({ ...contactObj, reason: 'Duplicate phone number' });
      } else {
        seenInBatch.add(normalizedPhone);
        validRows.push(contactObj);
      }
    }

    return {
      total: rows.length,
      validCount: validRows.length,
      duplicateCount: duplicateRows.length,
      invalidCount: invalidRows.length,
      blacklistedCount: blacklistedRows.length,
      validRows,
      duplicateRows,
      invalidRows,
      blacklistedRows,
    };
  }

  /**
   * Bulk inserts validated contacts into database
   */
  static async confirmBulkImport(validRows: any[], assignedUserId?: string) {
    if (validRows.length === 0) return { insertedCount: 0 };

    const docsToInsert = validRows.map((r) => ({
      phone: r.phone,
      name: r.name,
      email: r.email,
      city: r.city,
      company: r.company,
      customFields: r.customFields || {},
      assignedTo: assignedUserId || undefined,
      pipelineStage: 'New',
    }));

    const result = await Contact.insertMany(docsToInsert, { ordered: false });
    logger.info(`[Import] Bulk inserted ${result.length} contacts`);
    return { insertedCount: result.length };
  }

  /**
   * Generates a sample Excel template buffer
   */
  static generateSampleTemplate(): Buffer {
    const sampleData = [
      {
        'Full Name': 'Rahul Sharma',
        'Phone Number': '+91 9876543210',
        City: 'Mumbai',
        Email: 'rahul@example.com',
        Company: 'Acme Corp',
        Category: 'VIP Customer',
      },
      {
        'Full Name': 'Priya Patel',
        'Phone Number': '+91 9988776655',
        City: 'Delhi',
        Email: 'priya@example.com',
        Company: 'Global Tech',
        Category: 'New Lead',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Contacts');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
