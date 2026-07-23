export class SpintaxProcessor {
  /**
   * Processes a SpinTax string and resolves all random choices `{hi|hello|hey}`
   */
  static process(text: string): string {
    if (!text) return '';
    const regex = /\{([^{}]+)\}/g;

    let previous = '';
    let current = text;

    // Resolve nested SpinTax recursively until no braces remain
    while (current !== previous) {
      previous = current;
      current = current.replace(regex, (_, choicesStr) => {
        const choices = choicesStr.split('|');
        const randomIndex = Math.floor(Math.random() * choices.length);
        return choices[randomIndex];
      });
    }

    return current;
  }

  /**
   * Checks if SpinTax syntax is valid (matching braces)
   */
  static validate(text: string): boolean {
    let balance = 0;
    for (const char of text) {
      if (char === '{') balance++;
      if (char === '}') balance--;
      if (balance < 0) return false;
    }
    return balance === 0;
  }

  /**
   * Generates N distinct sample variations of the SpinTax text
   */
  static getPreview(text: string, count: number = 5): string[] {
    const variations = new Set<string>();
    const maxAttempts = count * 10;
    let attempts = 0;

    while (variations.size < count && attempts < maxAttempts) {
      variations.add(this.process(text));
      attempts++;
    }

    return Array.from(variations);
  }

  /**
   * Replaces variables in string with contact information
   */
  static replaceVariables(text: string, contactData: Record<string, any> = {}): string {
    if (!text) return '';

    const name = contactData.name || 'Valued Customer';
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let result = text
      .replace(/\{\{name\}\}/gi, name)
      .replace(/\{\{firstName\}\}/gi, firstName)
      .replace(/\{\{lastName\}\}/gi, lastName)
      .replace(/\{\{phone\}\}/gi, contactData.phone || '')
      .replace(/\{\{city\}\}/gi, contactData.city || 'your city')
      .replace(/\{\{email\}\}/gi, contactData.email || '')
      .replace(/\{\{company\}\}/gi, contactData.company || 'your company')
      .replace(/\{\{date\}\}/gi, dateStr)
      .replace(/\{\{time\}\}/gi, timeStr);

    // Custom fields substitution {{customField:FieldName}}
    result = result.replace(/\{\{customField:([^}]+)\}\}/gi, (_, fieldName) => {
      if (contactData.customFields && contactData.customFields[fieldName]) {
        return contactData.customFields[fieldName];
      }
      return '';
    });

    return result;
  }

  /**
   * Convenience method to process SpinTax and replace variables in one step
   */
  static compileMessage(text: string, contactData: Record<string, any> = {}): string {
    const spintaxResolved = this.process(text);
    return this.replaceVariables(spintaxResolved, contactData);
  }
}
