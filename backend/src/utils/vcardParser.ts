export interface ParsedVCardContact {
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  source: 'vcard_import';
}

/**
 * Native lightweight vCard (.vcf) file content parser
 */
export function parseVCardContent(vcardContent: string): ParsedVCardContact[] {
  if (!vcardContent) return [];

  const cards = vcardContent.split(/END:VCARD/i).filter((c) => c.includes('BEGIN:VCARD'));
  const results: ParsedVCardContact[] = [];

  for (const card of cards) {
    const lines = card.split(/\r?\n/);
    let name = '';
    let firstName = '';
    let lastName = '';
    let phone = '';
    let email = '';
    let company = '';
    let address = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('FN:')) {
        name = trimmed.substring(3).trim();
      } else if (trimmed.startsWith('N:')) {
        const parts = trimmed.substring(2).split(';');
        lastName = parts[0] || '';
        firstName = parts[1] || '';
        if (!name) name = `${firstName} ${lastName}`.trim();
      } else if (trimmed.includes('TEL') && trimmed.includes(':')) {
        const rawPhone = trimmed.split(':').pop() || '';
        if (!phone || trimmed.includes('CELL') || trimmed.includes('CELLULAR') || trimmed.includes('MOBILE')) {
          phone = rawPhone.replace(/[^0-9+]/g, '');
        }
      } else if (trimmed.includes('EMAIL') && trimmed.includes(':')) {
        email = trimmed.split(':').pop() || '';
      } else if (trimmed.startsWith('ORG:')) {
        company = trimmed.substring(4).replace(/;/g, ' ').trim();
      } else if (trimmed.startsWith('ADR:')) {
        address = trimmed.substring(4).replace(/;/g, ' ').trim();
      }
    }

    if (phone) {
      results.push({
        name: name || 'vCard Contact',
        firstName,
        lastName,
        phone,
        email,
        company,
        address,
        source: 'vcard_import',
      });
    }
  }

  return results;
}
