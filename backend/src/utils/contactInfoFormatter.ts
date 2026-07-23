export interface ContactInfo {
  website?: { url: string; label?: string };
  callNumbers?: Array<{ name?: string; number: string }>;
  whatsappNumbers?: Array<{
    name?: string;
    number: string;
    prefilledMessage?: string;
  }>;
  socialMedia?: {
    instagram?: { username: string; label?: string };
    facebook?: { pageId: string; label?: string };
    youtube?: { channel: string; label?: string };
    twitter?: { handle: string; label?: string };
    linkedin?: { profile: string; label?: string };
  };
  emails?: Array<{ name?: string; email: string }>;
  location?: { mapUrl?: string; label?: string; address?: string };
  customLinks?: Array<{ label: string; url: string; icon?: string }>;
}

export class ContactInfoFormatter {
  /**
   * Format contact info into WhatsApp message text with auto-clickable links
   */
  static formatToMessage(
    contactInfo: ContactInfo,
    header: string = '📞 *Contact Us:*'
  ): string {
    if (!this.hasContactInfo(contactInfo)) return '';

    const lines: string[] = [];

    lines.push('━━━━━━━━━━━━━━━━━━━━━');
    lines.push(header);
    lines.push('');

    // 🌐 Website
    if (contactInfo.website?.url?.trim()) {
      const label = contactInfo.website.label || 'Website';
      const url = this.cleanUrl(contactInfo.website.url);
      lines.push(`🌐 *${label}:*\n${url}\n`);
    }

    // 📞 Call Numbers
    if (contactInfo.callNumbers && contactInfo.callNumbers.length > 0) {
      contactInfo.callNumbers.forEach((call) => {
        if (!call.number?.trim()) return;
        const formattedNum = this.formatPhoneNumber(call.number);
        if (call.name?.trim()) {
          lines.push(`📞 *Call ${call.name}:*\n${formattedNum}\n`);
        } else {
          lines.push(`📞 *Call:* ${formattedNum}\n`);
        }
      });
    }

    // 💬 WhatsApp Direct Chat Links
    if (contactInfo.whatsappNumbers && contactInfo.whatsappNumbers.length > 0) {
      contactInfo.whatsappNumbers.forEach((wa) => {
        if (!wa.number?.trim()) return;
        const cleanNum = wa.number.replace(/\D/g, '');
        let waLink = `https://wa.me/${cleanNum}`;
        if (wa.prefilledMessage?.trim()) {
          waLink += `?text=${encodeURIComponent(wa.prefilledMessage)}`;
        }
        if (wa.name?.trim()) {
          lines.push(`💬 *WhatsApp ${wa.name}:*\n${waLink}\n`);
        } else {
          lines.push(`💬 *WhatsApp:* ${waLink}\n`);
        }
      });
    }

    // 📸 Instagram
    if (contactInfo.socialMedia?.instagram?.username?.trim()) {
      const username = contactInfo.socialMedia.instagram.username
        .replace('@', '')
        .replace('https://instagram.com/', '')
        .replace('instagram.com/', '');
      const label = contactInfo.socialMedia.instagram.label || 'Instagram';
      lines.push(`📸 *${label}:*\nhttps://instagram.com/${username}\n`);
    }

    // 🎥 YouTube
    if (contactInfo.socialMedia?.youtube?.channel?.trim()) {
      let channel = contactInfo.socialMedia.youtube.channel.trim();
      if (!channel.startsWith('http')) {
        if (!channel.startsWith('@')) channel = '@' + channel;
        channel = `https://youtube.com/${channel}`;
      }
      const label = contactInfo.socialMedia.youtube.label || 'YouTube';
      lines.push(`🎥 *${label}:*\n${channel}\n`);
    }

    // 📘 Facebook
    if (contactInfo.socialMedia?.facebook?.pageId?.trim()) {
      let pageId = contactInfo.socialMedia.facebook.pageId.trim();
      if (!pageId.startsWith('http')) {
        pageId = `https://facebook.com/${pageId}`;
      }
      const label = contactInfo.socialMedia.facebook.label || 'Facebook';
      lines.push(`📘 *${label}:*\n${pageId}\n`);
    }

    // 🐦 Twitter/X
    if (contactInfo.socialMedia?.twitter?.handle?.trim()) {
      let handle = contactInfo.socialMedia.twitter.handle
        .replace('@', '')
        .replace('https://twitter.com/', '')
        .replace('twitter.com/', '');
      const label = contactInfo.socialMedia.twitter.label || 'Twitter';
      lines.push(`🐦 *${label}:*\nhttps://twitter.com/${handle}\n`);
    }

    // 💼 LinkedIn
    if (contactInfo.socialMedia?.linkedin?.profile?.trim()) {
      let profile = contactInfo.socialMedia.linkedin.profile.trim();
      if (!profile.startsWith('http')) {
        profile = `https://linkedin.com/in/${profile}`;
      }
      const label = contactInfo.socialMedia.linkedin.label || 'LinkedIn';
      lines.push(`💼 *${label}:*\n${profile}\n`);
    }

    // 📧 Emails
    if (contactInfo.emails && contactInfo.emails.length > 0) {
      contactInfo.emails.forEach((em) => {
        if (!em.email?.trim()) return;
        if (em.name?.trim()) {
          lines.push(`📧 *Email ${em.name}:*\n${em.email}\n`);
        } else {
          lines.push(`📧 *Email:* ${em.email}\n`);
        }
      });
    }

    // 📍 Location
    if (contactInfo.location?.mapUrl?.trim() || contactInfo.location?.address?.trim()) {
      const label = contactInfo.location.label || 'Location';
      lines.push(`📍 *${label}:*`);
      if (contactInfo.location.address?.trim()) lines.push(contactInfo.location.address.trim());
      if (contactInfo.location.mapUrl?.trim()) lines.push(this.cleanUrl(contactInfo.location.mapUrl));
      lines.push('');
    }

    // 🔗 Custom Links
    if (contactInfo.customLinks && contactInfo.customLinks.length > 0) {
      contactInfo.customLinks.forEach((link) => {
        if (!link.url?.trim()) return;
        const icon = link.icon || '🔗';
        lines.push(`${icon} *${link.label || 'Link'}:*\n${this.cleanUrl(link.url)}\n`);
      });
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━');
    return lines.join('\n');
  }

  /**
   * Check if contact info has any non-empty fields
   */
  static hasContactInfo(contactInfo: ContactInfo): boolean {
    if (!contactInfo) return false;
    if (contactInfo.website?.url?.trim()) return true;
    if (contactInfo.callNumbers?.some((c) => c.number?.trim())) return true;
    if (contactInfo.whatsappNumbers?.some((w) => w.number?.trim())) return true;
    if (contactInfo.emails?.some((e) => e.email?.trim())) return true;
    if (contactInfo.customLinks?.some((l) => l.url?.trim())) return true;
    if (contactInfo.location?.mapUrl?.trim() || contactInfo.location?.address?.trim()) return true;

    const sm = contactInfo.socialMedia;
    if (sm?.instagram?.username?.trim()) return true;
    if (sm?.youtube?.channel?.trim()) return true;
    if (sm?.facebook?.pageId?.trim()) return true;
    if (sm?.twitter?.handle?.trim()) return true;
    if (sm?.linkedin?.profile?.trim()) return true;

    return false;
  }

  /**
   * Format phone number cleanly with international + prefix
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+91 ${cleaned.substring(2, 7)} ${cleaned.substring(7)}`;
    }
    return cleaned.startsWith('+') ? phone : `+${cleaned}`;
  }

  /**
   * Ensure URL starts with http:// or https://
   */
  static cleanUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return 'https://' + trimmed;
    }
    return trimmed;
  }
}

export default ContactInfoFormatter;
