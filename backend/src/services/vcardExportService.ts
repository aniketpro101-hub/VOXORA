import fs from 'fs';
import path from 'path';
import { Contact } from '../models/Contact.js';
import { logger } from '../utils/logger.js';

export class VCardExportService {
  /**
   * Formats a single contact into vCard 3.0 string specification
   */
  static generateVCard(contact: any): string {
    const name = contact.name || contact.displayName || contact.phone;
    const phone = contact.phone || '';
    const email = contact.email || '';
    const company = contact.company || '';
    const notes = contact.notes || '';

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${name}`,
      `N:${name};;;;`,
      `TEL;TYPE=CELL:${phone}`,
      email ? `EMAIL:${email}` : '',
      company ? `ORG:${company}` : '',
      notes ? `NOTE:${notes}` : '',
      'END:VCARD',
    ].filter(Boolean);

    return lines.join('\r\n');
  }

  /**
   * Generates a combined .vcf file for an array of contact IDs
   */
  static async exportContactsToVCard(contactIds: string[]): Promise<string> {
    const contacts = await Contact.find({ _id: { $in: contactIds } });
    if (!contacts.length) throw new Error('No contacts found for vCard export');

    const vcards = contacts.map((c) => this.generateVCard(c));
    return vcards.join('\r\n\r\n');
  }

  /**
   * Saves vCard file to disk and returns download relative URL
   */
  static async exportToFile(contactIds: string[]): Promise<string> {
    const content = await this.exportContactsToVCard(contactIds);

    const exportDir = path.join(process.cwd(), 'uploads', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filename = `voxora_contacts_${Date.now()}.vcf`;
    const filePath = path.join(exportDir, filename);

    fs.writeFileSync(filePath, content, 'utf-8');
    logger.info(`[vCardExport] Created vCard file at ${filePath}`);

    return `/uploads/exports/${filename}`;
  }
}
