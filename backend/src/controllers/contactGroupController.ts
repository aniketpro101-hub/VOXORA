import { Response, NextFunction } from 'express';
import { ContactGroup } from '../models/ContactGroup.js';
import { ImportHistory } from '../models/ImportHistory.js';
import { Contact } from '../models/Contact.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

export const getContactGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter = req.user?.role === 'admin' || !req.user?.userId ? {} : { owner: req.user.userId };
    const groups = await ContactGroup.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, 'Contact groups retrieved', groups);
  } catch (error) {
    next(error);
  }
};

export const createContactGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    if (!name) return sendError(res, 'Group name is required', 400);

    const group = await ContactGroup.create({
      name,
      description: description || '',
      contacts: [],
      contactCount: 0,
      owner: req.user?.userId,
    });

    return sendSuccess(res, 'Contact group created', group, 201);
  } catch (error) {
    next(error);
  }
};

export const updateContactGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const group = await ContactGroup.findById(id);
    if (!group) return sendError(res, 'Group not found', 404);

    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    await group.save();
    return sendSuccess(res, 'Contact group updated', group);
  } catch (error) {
    next(error);
  }
};

export const deleteContactGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await ContactGroup.findByIdAndDelete(id);
    return sendSuccess(res, 'Contact group deleted');
  } catch (error) {
    next(error);
  }
};

export const getImportHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const history = await ImportHistory.find().sort({ createdAt: -1 });
    return sendSuccess(res, 'Import history retrieved', history);
  } catch (error) {
    next(error);
  }
};

export const createImportHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileName, totalRows, validRows, invalidRows, duplicateRows, groupName } = req.body;
    const item = await ImportHistory.create({
      fileName: fileName || 'paste_import.txt',
      totalRows: totalRows || 0,
      validRows: validRows || 0,
      invalidRows: invalidRows || 0,
      duplicateRows: duplicateRows || 0,
      groupName: groupName || 'General',
      importedBy: req.user?.userId || '650000000000000000000001',
    });

    return sendSuccess(res, 'Import history recorded', item, 201);
  } catch (error) {
    next(error);
  }
};
