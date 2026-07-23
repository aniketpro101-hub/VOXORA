export interface ParsedGoogleContact {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  company?: string;
  designation?: string;
  address?: string;
  notes?: string;
  source: 'google_contacts';
}

/**
 * Parses Google Contacts CSV file content
 */
export function parseGoogleContactsCSV(csvText: string): ParsedGoogleContact[] {
  if (!csvText) return [];

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
  const results: ParsedGoogleContact[] = [];

  const nameIdx = headers.findIndex((h) => h.includes('Name') || h.includes('Given Name'));
  const givenNameIdx = headers.findIndex((h) => h === 'Given Name');
  const familyNameIdx = headers.findIndex((h) => h === 'Family Name');
  const phoneIdx = headers.findIndex((h) => h.includes('Phone 1') || h.includes('Phone') || h.includes('Value'));
  const emailIdx = headers.findIndex((h) => h.includes('E-mail 1') || h.includes('Email'));
  const orgIdx = headers.findIndex((h) => h.includes('Organization 1') || h.includes('Company'));
  const titleIdx = headers.findIndex((h) => h.includes('Title') || h.includes('Job Title'));

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    const phone = phoneIdx !== -1 ? (cols[phoneIdx] || '').replace(/[^0-9+]/g, '') : '';
    if (!phone) continue;

    const firstName = givenNameIdx !== -1 ? cols[givenNameIdx] || '' : '';
    const lastName = familyNameIdx !== -1 ? cols[familyNameIdx] || '' : '';
    let name = nameIdx !== -1 ? cols[nameIdx] || '' : '';
    if (!name) name = `${firstName} ${lastName}`.trim();

    results.push({
      name: name || 'Google Contact',
      firstName,
      lastName,
      phone,
      email: emailIdx !== -1 ? cols[emailIdx] || '' : '',
      company: orgIdx !== -1 ? cols[orgIdx] || '' : '',
      designation: titleIdx !== -1 ? cols[titleIdx] || '' : '',
      source: 'google_contacts',
    });
  }

  return results;
}
