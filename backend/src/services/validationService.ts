import { WHATSAPP_LIMITS } from '../config/limits.js';
import { logger } from '../utils/logger.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class ValidationService {
  // ═══ VALIDATE FILE UPLOAD ═══
  validateFile(file: { name: string; size: number; mimetype: string }): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    let fileConfig: any = null;
    let typeName = '';

    if (file.mimetype.startsWith('image/')) {
      fileConfig = WHATSAPP_LIMITS.FILES.IMAGE;
      typeName = 'Image';
    } else if (file.mimetype.startsWith('video/')) {
      fileConfig = WHATSAPP_LIMITS.FILES.VIDEO;
      typeName = 'Video';
    } else if (file.mimetype.startsWith('audio/')) {
      fileConfig = WHATSAPP_LIMITS.FILES.AUDIO;
      typeName = 'Audio';
    } else if (this.isDocumentType(file.mimetype)) {
      fileConfig = WHATSAPP_LIMITS.FILES.DOCUMENT;
      typeName = 'Document';
    } else {
      result.valid = false;
      result.errors.push(`File type "${file.mimetype}" is not supported by WhatsApp.`);
      result.suggestions.push('Upload an Image (JPG/PNG/WebP), Video (MP4), Audio (MP3/OGG), or Document (PDF/DOCX/XLSX).');
      return result;
    }

    // Check file size
    if (file.size > fileConfig.maxSize) {
      result.valid = false;
      result.errors.push(
        `${typeName} file size (${this.formatBytes(file.size)}) exceeds WhatsApp limit of ${fileConfig.maxSizeMB} MB.`
      );
      result.suggestions.push(`Compress the ${typeName.toLowerCase()} to under ${fileConfig.maxSizeMB} MB before uploading.`);
      return result;
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!fileConfig.allowedExtensions.includes(extension)) {
      result.valid = false;
      result.errors.push(
        `File extension "${extension}" is not permitted. Allowed extensions: ${fileConfig.allowedExtensions.join(', ')}`
      );
      return result;
    }

    // Recommendation warning for performance
    if (file.size > fileConfig.recommendedSize) {
      result.warnings.push(
        `${typeName} is ${this.formatBytes(file.size)}. Recommended size for optimal delivery speed is under ${
          fileConfig.recommendedSize / (1024 * 1024)
        } MB.`
      );
      result.suggestions.push(`Optimizing file size improves delivery rates and saves user data.`);
    }

    return result;
  }

  // ═══ VALIDATE TEXT MESSAGE ═══
  validateTextMessage(text: string, hasButtons: boolean = false): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    if (!text || text.trim().length === 0) {
      result.valid = false;
      result.errors.push('Message text cannot be empty.');
      return result;
    }

    const maxLength = hasButtons ? WHATSAPP_LIMITS.MESSAGES.TEXT_WITH_BUTTONS.bodyMaxLength : WHATSAPP_LIMITS.MESSAGES.TEXT.maxLength;
    const recommendedLength = hasButtons ? WHATSAPP_LIMITS.MESSAGES.TEXT_WITH_BUTTONS.recommendedBodyLength : WHATSAPP_LIMITS.MESSAGES.TEXT.recommendedLength;

    if (text.length > maxLength) {
      result.valid = false;
      result.errors.push(
        `Message length (${text.length} chars) exceeds maximum allowed length of ${maxLength} chars ${
          hasButtons ? '(with buttons)' : ''
        }.`
      );
      result.suggestions.push(`Shorten message by ${text.length - maxLength} characters.`);
      return result;
    }

    if (text.length > recommendedLength) {
      result.warnings.push(
        `Message length is ${text.length} chars. Messages under ${recommendedLength} chars yield 34% higher response rates.`
      );
    }

    const spamCheck = this.checkSpamPatterns(text);
    if (spamCheck.warnings.length > 0) {
      result.warnings.push(...spamCheck.warnings);
      result.suggestions.push(...spamCheck.suggestions);
    }

    return result;
  }

  // ═══ VALIDATE BUTTONS ═══
  validateButtons(buttons: any[]): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    const limits = WHATSAPP_LIMITS.MESSAGES.BUTTON;

    if (buttons.length > limits.maxButtons) {
      result.valid = false;
      result.errors.push(`Too many buttons: ${buttons.length}. WhatsApp allows maximum ${limits.maxButtons} buttons per message.`);
      result.suggestions.push(`Remove extra buttons to keep count at ${limits.maxButtons} or fewer.`);
      return result;
    }

    buttons.forEach((btn, idx) => {
      const btnTitle = btn.title || btn.text || '';
      if (btnTitle.length > limits.textMaxLength) {
        result.valid = false;
        result.errors.push(
          `Button ${idx + 1} text "${btnTitle}" (${btnTitle.length} chars) exceeds maximum limit of ${limits.textMaxLength} chars.`
        );
        result.suggestions.push(`Shorten button ${idx + 1} label to ${limits.textMaxLength} characters.`);
      }

      if (btn.type === 'url' && btn.url && !this.isValidUrl(btn.url)) {
        result.valid = false;
        result.errors.push(`Button ${idx + 1} URL "${btn.url}" is invalid. Must include http:// or https://.`);
      }

      if (btn.type === 'call' && btn.phone && !this.isValidPhone(btn.phone)) {
        result.valid = false;
        result.errors.push(`Button ${idx + 1} phone number "${btn.phone}" is invalid.`);
      }
    });

    return result;
  }

  // ═══ VALIDATE LIST MENU ═══
  validateList(list: any): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    const limits = WHATSAPP_LIMITS.MESSAGES.LIST;

    if (list.title && list.title.length > limits.titleMaxLength) {
      result.valid = false;
      result.errors.push(`List title too long (${list.title.length} chars). Maximum allowed is ${limits.titleMaxLength} chars.`);
    }

    if (list.buttonText && list.buttonText.length > limits.buttonTextMaxLength) {
      result.valid = false;
      result.errors.push(`List button text too long (${list.buttonText.length} chars). Maximum is ${limits.buttonTextMaxLength} chars.`);
    }

    if (list.sections && list.sections.length > limits.maxSections) {
      result.valid = false;
      result.errors.push(`Too many list sections (${list.sections.length}). Maximum allowed is ${limits.maxSections}.`);
    }

    const totalRows =
      list.sections?.reduce((sum: number, section: any) => sum + (section.rows?.length || 0), 0) || 0;

    if (totalRows > limits.maxTotalRows) {
      result.valid = false;
      result.errors.push(`Too many total list options (${totalRows}). Maximum allowed is ${limits.maxTotalRows}.`);
    }

    list.sections?.forEach((section: any, sIdx: number) => {
      section.rows?.forEach((row: any, rIdx: number) => {
        if (row.title && row.title.length > limits.rowTitleMaxLength) {
          result.valid = false;
          result.errors.push(
            `Section ${sIdx + 1}, Row ${rIdx + 1} title "${row.title}" exceeds maximum length of ${limits.rowTitleMaxLength} chars.`
          );
        }
        if (row.description && row.description.length > limits.descriptionMaxLength) {
          result.valid = false;
          result.errors.push(
            `Section ${sIdx + 1}, Row ${rIdx + 1} description exceeds maximum length of ${limits.descriptionMaxLength} chars.`
          );
        }
      });
    });

    return result;
  }

  // ═══ VALIDATE COMPLETE MESSAGE ═══
  validateCompleteMessage(message: {
    text?: string;
    caption?: string;
    file?: any;
    buttons?: any[];
    list?: any;
  }): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    if (message.text) {
      const textResult = this.validateTextMessage(message.text, (message.buttons?.length || 0) > 0);
      this.mergeResults(result, textResult);
    }

    if (message.file) {
      const fileResult = this.validateFile(message.file);
      this.mergeResults(result, fileResult);
    }

    if (message.buttons && message.buttons.length > 0) {
      const buttonResult = this.validateButtons(message.buttons);
      this.mergeResults(result, buttonResult);
    }

    if (message.list) {
      const listResult = this.validateList(message.list);
      this.mergeResults(result, listResult);
    }

    if (message.buttons && message.buttons.length > 0 && message.list) {
      result.valid = false;
      result.errors.push('WhatsApp does not allow sending both Quick Reply Buttons and a List Menu in the same message.');
      result.suggestions.push('Choose either Buttons or a List Menu.');
    }

    return result;
  }

  // ═══ HELPER UTILITIES ═══
  private mergeResults(main: ValidationResult, other: ValidationResult) {
    if (!other.valid) main.valid = false;
    main.errors.push(...other.errors);
    main.warnings.push(...other.warnings);
    main.suggestions.push(...other.suggestions);
  }

  private isDocumentType(mimetype: string): boolean {
    return WHATSAPP_LIMITS.FILES.DOCUMENT.allowedTypes.includes(mimetype);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidPhone(phone: string): boolean {
    return /^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''));
  }

  public formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  private checkSpamPatterns(text: string): { warnings: string[]; suggestions: string[] } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5 && text.length > 20) {
      warnings.push('High concentration of CAPITAL letters detected (increased WhatsApp spam risk).');
      suggestions.push('Use standard title/sentence casing.');
    }

    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 5) {
      warnings.push(`Excessive exclamation marks (${exclamationCount}) detected.`);
      suggestions.push('Limit exclamation marks to 1-2 per message.');
    }

    const spamWords = ['FREE MONEY', 'WIN NOW', 'CLICK HERE URGENT', '100% FREE CASINO'];
    const foundSpam = spamWords.filter((word) => text.toUpperCase().includes(word));
    if (foundSpam.length > 0) {
      warnings.push(`Contains spam phrase: "${foundSpam.join(', ')}".`);
      suggestions.push('Rephrase to sound natural to avoid WhatsApp anti-spam filters.');
    }

    return { warnings, suggestions };
  }
}

export default new ValidationService();
