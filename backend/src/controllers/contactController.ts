import { Response, NextFunction } from 'express';
import { Contact } from '../models/Contact.js';
import { ContactGroup } from '../models/ContactGroup.js';
import { ImportHistory } from '../models/ImportHistory.js';
import { AutoNameConfig } from '../models/AutoNameConfig.js';
import { Campaign } from '../models/Campaign.js';
import { MessageLog } from '../models/MessageLog.js';
import { WhatsAppContactService } from '../services/whatsappContactService.js';
import { BaileysEngine } from '../services/baileysEngine.js';
import { parseVCardContent } from '../utils/vcardParser.js';
import { parseGoogleContactsCSV } from '../utils/googleCsvParser.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

/**
 * 1. Get Contacts (Paginated & Filtered)
 */
export const getContacts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, search, group, tab, source, country } = req.query;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } },
      ];
    }

    if (group && group !== 'all') {
      const foundGrp = await ContactGroup.findOne({ name: group });
      if (foundGrp) query.groups = foundGrp._id;
    }

    if (tab === 'favorites') query.isFavorite = true;
    else if (tab === 'unsaved') query.isAutoNamed = true;
    else if (tab === 'whatsapp') query.isOnWhatsApp = true;
    else if (tab === 'blacklisted') query.isBlacklisted = true;

    if (source) query.source = source;
    if (country) query.countryCode = country;

    const total = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .populate('groups', 'name color icon')
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    return sendSuccess(res, 'Contacts retrieved', {
      contacts,
      total,
      page: +page,
      pages: Math.ceil(total / +limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Create Single Contact
 */
export const createContact = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone, email, company, designation, city, countryCode = '91', tags = [], groups = [] } = req.body;

    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) return sendError(res, 'Valid phone number required', 400);

    const fullPhone = cleanPhone.length === 10 ? `${countryCode}${cleanPhone}` : cleanPhone;

    const existing = await Contact.findOne({ phone: fullPhone });
    if (existing) {
      return sendError(res, 'Contact with this phone number already exists', 400);
    }

    const contact = await Contact.create({
      name: name || `Contact ${fullPhone.slice(-4)}`,
      phone: fullPhone,
      normalizedPhone: fullPhone,
      email,
      company,
      designation,
      city,
      countryCode,
      tags,
      groups,
      source: 'manual',
      createdBy: req.user?.userId,
    });

    return sendSuccess(res, 'Contact created successfully', contact, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Update Contact
 */
export const updateContact = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, email, company, designation, city, tags, groups, isFavorite, isBlacklisted, customFields } = req.body;

    const allowedUpdates: any = {};
    if (name !== undefined) allowedUpdates.name = name;
    if (email !== undefined) allowedUpdates.email = email;
    if (company !== undefined) allowedUpdates.company = company;
    if (designation !== undefined) allowedUpdates.designation = designation;
    if (city !== undefined) allowedUpdates.city = city;
    if (tags !== undefined) allowedUpdates.tags = tags;
    if (groups !== undefined) allowedUpdates.groups = groups;
    if (isFavorite !== undefined) allowedUpdates.isFavorite = isFavorite;
    if (isBlacklisted !== undefined) allowedUpdates.isBlacklisted = isBlacklisted;
    if (customFields !== undefined) allowedUpdates.customFields = customFields;

    const contact = await Contact.findByIdAndUpdate(id, allowedUpdates, { new: true });
    if (!contact) return sendError(res, 'Contact not found', 404);

    return sendSuccess(res, 'Contact updated', contact);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Delete Contact
 */
export const deleteContact = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await Contact.findByIdAndDelete(id);
    return sendSuccess(res, 'Contact deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Toggle Favorite
 */
export const toggleFavorite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact) return sendError(res, 'Contact not found', 404);

    contact.isFavorite = !contact.isFavorite;
    await contact.save();

    return sendSuccess(res, `Contact ${contact.isFavorite ? 'starred as favorite' : 'unstarred'}`, contact);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Add Note to Contact
 */
export const addContactNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const contact = await Contact.findById(id);
    if (!contact) return sendError(res, 'Contact not found', 404);

    if (!contact.contactNotes) contact.contactNotes = [];
    contact.contactNotes.unshift({ text, createdBy: req.user?.userId || 'Agent', createdAt: new Date() });

    await contact.save();
    return sendSuccess(res, 'Note added', contact);
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Grab WhatsApp Contacts
 */
export const grabWhatsAppContacts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId = 'voxora_instance', autoNamePrefix = 'WA', groupName = 'WhatsApp Contacts' } = req.body;

    const fetched = await WhatsAppContactService.fetchAllContacts(instanceId);
    const autoNamed = WhatsAppContactService.autoNameContacts(fetched, autoNamePrefix);

    let newCount = 0;
    for (const item of autoNamed) {
      const exists = await Contact.findOne({ phone: item.phone });
      if (!exists) {
        await Contact.create({
          name: item.name,
          phone: item.phone,
          normalizedPhone: item.phone,
          whatsappName: item.whatsappName,
          whatsappProfilePic: item.whatsappProfilePic,
          whatsappAbout: item.whatsappAbout,
          isOnWhatsApp: true,
          source: 'whatsapp_contact',
          isAutoNamed: item.isAutoNamed,
          autoName: item.autoName,
          createdBy: req.user?.userId || '650000000000000000000001',
        });
        newCount++;
      }
    }

    await ImportHistory.create({
      source: 'whatsapp_contacts',
      fileName: `WhatsApp_Contacts_${instanceId}.json`,
      totalRows: fetched.length,
      validRows: fetched.length,
      invalidRows: 0,
      duplicateRows: fetched.length - newCount,
      newContactsAdded: newCount,
      groupName,
    });

    return sendSuccess(res, `Grabbed ${fetched.length} WhatsApp contacts (${newCount} new saved)`, {
      total: fetched.length,
      newCount,
      contacts: autoNamed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Grab WhatsApp Group Members
 */
export const grabWhatsAppGroupMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId = 'voxora_instance', groupId = 'grp_biz_1', autoNamePrefix = 'GRP' } = req.body;

    const members = await WhatsAppContactService.fetchGroupMembers(instanceId, groupId);
    const autoNamed = WhatsAppContactService.autoNameContacts(members, autoNamePrefix);

    let newCount = 0;
    for (const m of autoNamed) {
      const exists = await Contact.findOne({ phone: m.phone });
      if (!exists) {
        await Contact.create({
          name: m.name,
          phone: m.phone,
          normalizedPhone: m.phone,
          whatsappName: m.whatsappName,
          isOnWhatsApp: true,
          source: 'whatsapp_group',
          isAutoNamed: m.isAutoNamed,
          autoName: m.autoName,
          createdBy: req.user?.userId || '650000000000000000000001',
        });
        newCount++;
      }
    }

    return sendSuccess(res, `Grabbed ${members.length} group members (${newCount} new saved)`, {
      total: members.length,
      newCount,
      members: autoNamed,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Import vCard (.vcf)
 */
export const importVCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileContent, groupName = 'vCard Imports' } = req.body;
    const parsed = parseVCardContent(fileContent);

    let newCount = 0;
    for (const c of parsed) {
      const exists = await Contact.findOne({ phone: c.phone });
      if (!exists) {
        await Contact.create({
          name: c.name,
          phone: c.phone,
          email: c.email,
          company: c.company,
          address: c.address,
          source: 'vcard_import',
          createdBy: req.user?.userId || '650000000000000000000001',
        });
        newCount++;
      }
    }

    return sendSuccess(res, `Imported ${parsed.length} contacts from vCard file (${newCount} new)`, {
      total: parsed.length,
      newCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. Import Google Contacts CSV
 */
export const importGoogleCSV = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileContent, groupName = 'Google Contacts' } = req.body;
    const parsed = parseGoogleContactsCSV(fileContent);

    let newCount = 0;
    for (const c of parsed) {
      const exists = await Contact.findOne({ phone: c.phone });
      if (!exists) {
        await Contact.create({
          name: c.name,
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone,
          email: c.email,
          company: c.company,
          designation: c.designation,
          source: 'google_contacts',
          createdBy: req.user?.userId || '650000000000000000000001',
        });
        newCount++;
      }
    }

    return sendSuccess(res, `Imported ${parsed.length} contacts from Google Contacts (${newCount} new)`, {
      total: parsed.length,
      newCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 11. Quick Message (REAL WHATSAPP MESSAGE SEND)
 */
export const sendQuickMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phone, message, instanceId, saveContact, name } = req.body;
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

    if (!cleanPhone || !message) {
      return sendError(res, 'Phone and message text are required', 400);
    }

    // 1. ACTUALLY DISPATCH MESSAGE VIA BAILEYS ENGINE
    await BaileysEngine.sendMessage(instanceId || '', cleanPhone, message);

    if (saveContact) {
      const exists = await Contact.findOne({ phone: cleanPhone });
      if (!exists) {
        await Contact.create({
          name: name || `Contact ${cleanPhone.slice(-4)}`,
          phone: cleanPhone,
          source: 'quick_message',
          createdBy: req.user?.userId || '650000000000000000000001',
        });
      }
    }

    // 2. Create Campaign record & MessageLog ONLY after successful Baileys dispatch
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const quickCampaign = await Campaign.create({
      name: `⚡ Quick Send - ${dateStr}`,
      messageTemplates: [message],
      stats: { totalContacts: 1, sentCount: 1, deliveredCount: 1, readCount: 0, failedCount: 0 },
      status: 'completed',
      type: 'regular',
      owner: req.user?.userId || '650000000000000000000001',
    });

    await MessageLog.create({
      campaignId: quickCampaign._id,
      instanceId: instanceId || 'default',
      recipientPhone: cleanPhone,
      messageType: 'text',
      content: { text: message },
      status: 'delivered',
    });

    return sendSuccess(res, `Quick Message sent to +${cleanPhone} via WhatsApp!`, { campaignId: quickCampaign._id });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to send WhatsApp message', 400);
  }
};

/**
 * 12. Contact Health Check (Real WhatsApp Verification)
 */
export const verifyWhatsAppContacts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const contacts = await Contact.find().limit(100);
    let verifiedCount = 0;

    for (const c of contacts) {
      const isOnWa = await BaileysEngine.checkOnWhatsApp('', c.phone);
      c.isOnWhatsApp = isOnWa;
      await c.save();
      if (isOnWa) verifiedCount++;
    }

    return sendSuccess(res, `Verified ${contacts.length} contacts on WhatsApp (${verifiedCount} active)`, {
      total: contacts.length,
      onWhatsApp: verifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 13. Get Contact Stats Bar
 */
export const getContactStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const total = await Contact.countDocuments();
    const groups = await ContactGroup.countDocuments();
    const whatsapp = await Contact.countDocuments({ isOnWhatsApp: true });
    const blacklisted = await Contact.countDocuments({ isBlacklisted: true });
    const favorites = await Contact.countDocuments({ isFavorite: true });

    return sendSuccess(res, 'Contact stats retrieved', {
      total,
      groups,
      today: 0,
      whatsapp,
      blacklisted,
      favorites,
    });
  } catch (error) {
    next(error);
  }
};
