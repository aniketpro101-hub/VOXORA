export class SpintaxProcessor {
  static process(text: string): string {
    if (!text) return '';
    const regex = /\{([^{}]+)\}/g;
    let previous = '';
    let current = text;

    while (current !== previous) {
      previous = current;
      current = current.replace(regex, (_, choicesStr) => {
        const choices = choicesStr.split('|');
        return choices[0] || '';
      });
    }

    return current;
  }

  static replaceVariables(text: string, contactData: Record<string, any> = {}): string {
    if (!text) return '';

    const name = contactData.name || 'Rahul Sharma';
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;

    return text
      .replace(/\{\{name\}\}/gi, name)
      .replace(/\{\{firstName\}\}/gi, firstName)
      .replace(/\{\{phone\}\}/gi, contactData.phone || '9876543210')
      .replace(/\{\{city\}\}/gi, contactData.city || 'Mumbai')
      .replace(/\{\{company\}\}/gi, contactData.company || 'Acme Corp');
  }

  static compileMessage(text: string, contactData: Record<string, any> = {}): string {
    const spintaxResolved = this.process(text);
    return this.replaceVariables(spintaxResolved, contactData);
  }
}
