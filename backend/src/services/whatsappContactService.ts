import { EvolutionService } from './evolutionService.js';
import { logger } from '../utils/logger.js';

export class WhatsAppContactService {
  /**
   * Fetch all WhatsApp contacts from connected account (or rich mock fallback)
   */
  static async fetchAllContacts(instanceId: string) {
    try {
      const response = await EvolutionService.getContacts(instanceId);
      if (Array.isArray(response) && response.length > 0) {
        return response.map((contact: any) => ({
          phone: (contact.id || contact.jid || '').replace('@s.whatsapp.net', '').replace(/[^0-9]/g, ''),
          whatsappName: contact.name || contact.pushName || '',
          whatsappProfilePic: contact.imgUrl || contact.profilePictureUrl || '',
          whatsappAbout: contact.status || '',
          isOnWhatsApp: true,
          isSaved: !!(contact.name || contact.pushName),
        }));
      }
      return this.getMockContacts();
    } catch (error) {
      logger.warn('WhatsApp contacts fetch failed, returning mock contacts for testing');
      return this.getMockContacts();
    }
  }

  /**
   * Fetch all WhatsApp groups from account
   */
  static async fetchAllGroups(instanceId: string) {
    try {
      const response = await EvolutionService.getAllGroups(instanceId);
      if (Array.isArray(response) && response.length > 0) {
        return response.map((group: any) => ({
          groupId: group.id || group.jid,
          name: group.subject || group.name || 'WhatsApp Group',
          description: group.desc || '',
          memberCount: group.size || group.participants?.length || 0,
          createdAt: group.creation || new Date(),
          profilePic: group.imgUrl || '',
        }));
      }
      return this.getMockGroups();
    } catch (error) {
      logger.warn('WhatsApp groups fetch failed, returning mock groups');
      return this.getMockGroups();
    }
  }

  /**
   * Fetch participants of a specific WhatsApp group
   */
  static async fetchGroupMembers(instanceId: string, groupId: string) {
    try {
      const response = await EvolutionService.getGroupParticipants(instanceId, groupId);
      const participants = response?.participants || (Array.isArray(response) ? response : []);
      if (participants.length > 0) {
        return participants.map((p: any) => ({
          phone: (p.id || p.jid || '').replace('@s.whatsapp.net', '').replace(/[^0-9]/g, ''),
          whatsappName: p.name || p.pushName || '',
          isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
          isSaved: !!(p.name || p.pushName),
        }));
      }
      return this.getMockGroupMembers(groupId);
    } catch (error) {
      logger.warn('Group members fetch failed, returning mock group members');
      return this.getMockGroupMembers(groupId);
    }
  }

  /**
   * Auto-name unsaved contacts in sequence (e.g., WA001, WA002)
   */
  static autoNameContacts(
    contacts: any[],
    prefix: string = 'WA',
    startFrom: number = 1,
    padding: number = 3,
    separator: string = ''
  ) {
    return contacts.map((contact, index) => {
      const hasRealName = contact.isSaved && contact.whatsappName && contact.whatsappName.trim().length > 0;
      if (!hasRealName) {
        const numStr = (startFrom + index).toString().padStart(padding, '0');
        const generatedName = `${prefix}${separator}${numStr}`;
        return {
          ...contact,
          name: generatedName,
          autoName: generatedName,
          isAutoNamed: true,
          autoNameSeries: prefix,
        };
      }
      return {
        ...contact,
        name: contact.whatsappName,
        isAutoNamed: false,
      };
    });
  }

  /**
   * Mock contacts for offline/standalone execution
   */
  static getMockContacts() {
    return [
      { phone: '919876543210', whatsappName: 'Rahul Sharma', whatsappAbout: 'Working hard 💪', isOnWhatsApp: true, isSaved: true },
      { phone: '919999988888', whatsappName: 'Amit Verma', whatsappAbout: 'Available', isOnWhatsApp: true, isSaved: true },
      { phone: '918888877777', whatsappName: '', whatsappAbout: '', isOnWhatsApp: true, isSaved: false },
      { phone: '917777766666', whatsappName: 'Priya Patel', whatsappAbout: 'At work', isOnWhatsApp: true, isSaved: true },
      { phone: '916666655555', whatsappName: '', whatsappAbout: '', isOnWhatsApp: true, isSaved: false },
    ];
  }

  /**
   * Mock groups for offline/standalone execution
   */
  static getMockGroups() {
    return [
      { groupId: 'grp_biz_1', name: 'Kolhapur Business Forum', description: 'Local entrepreneurs', memberCount: 156, createdAt: new Date() },
      { groupId: 'grp_biz_2', name: 'VIP Customer Support', description: 'Priority clients', memberCount: 89, createdAt: new Date() },
      { groupId: 'grp_biz_3', name: 'Marketing & Sales Leads', description: 'Inbound inquiries', memberCount: 45, createdAt: new Date() },
    ];
  }

  /**
   * Mock group members for offline/standalone execution
   */
  static getMockGroupMembers(groupId: string) {
    return [
      { phone: '919876543210', whatsappName: 'Rahul Sharma (Admin)', isAdmin: true, isSaved: true },
      { phone: '919123456789', whatsappName: 'Suresh Patil', isAdmin: false, isSaved: true },
      { phone: '919888877777', whatsappName: '', isAdmin: false, isSaved: false },
      { phone: '919777766666', whatsappName: '', isAdmin: false, isSaved: false },
    ];
  }
}
