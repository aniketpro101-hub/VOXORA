import { Response, NextFunction } from 'express';
import { Contact } from '../models/Contact.js';
import { Pipeline } from '../models/Pipeline.js';
import { Deal } from '../models/Deal.js';
import { Task } from '../models/Task.js';
import { Note } from '../models/Note.js';
import { Tag } from '../models/Tag.js';
import { Team } from '../models/Team.js';
import { LeadScoringEngine } from '../services/leadScoringService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

// --- CONTACTS ---
export const listContacts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const query: any = req.user?.role === 'admin' || !req.user?.userId ? {} : { createdBy: req.user.userId };
    if (search) {
      query.$or = [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }];
    }

    const contacts = await Contact.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Contact.countDocuments(query);
    return sendSuccess(res, 'Contacts retrieved', { contacts, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getContactById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact) return sendError(res, 'Contact not found', 404);

    const notes = await Note.find({ contactId: id }).sort({ isPinned: -1, createdAt: -1 });
    const tasks = await Task.find({ contactId: id }).sort({ dueDate: 1 });
    const deals = await Deal.find({ contactId: id }).sort({ createdAt: -1 });

    return sendSuccess(res, 'Contact details retrieved', { contact, notes, tasks, deals });
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const contact = await Contact.create({
      ...req.body,
      createdBy: req.user?.userId,
    });
    return sendSuccess(res, 'Contact created', contact, 201);
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndUpdate(id, req.body, { new: true });
    if (!contact) return sendError(res, 'Contact not found', 404);
    return sendSuccess(res, 'Contact updated', contact);
  } catch (error) {
    next(error);
  }
};

// --- PIPELINES & DEALS ---
export const listPipelines = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let pipelines = await Pipeline.find({ owner: req.user?.userId });
    if (pipelines.length === 0) {
      const defaultPipeline = await Pipeline.create({
        name: 'Sales Pipeline',
        isDefault: true,
        owner: req.user!.userId,
        stages: [
          { stageId: 's1', name: 'New Lead', order: 1, color: '#3b82f6', probability: 10, targetDurationDays: 3 },
          { stageId: 's2', name: 'Contacted', order: 2, color: '#8b5cf6', probability: 30, targetDurationDays: 5 },
          { stageId: 's3', name: 'Qualified', order: 3, color: '#ec4899', probability: 60, targetDurationDays: 7 },
          { stageId: 's4', name: 'Negotiation', order: 4, color: '#f59e0b', probability: 80, targetDurationDays: 5 },
          { stageId: 's5', name: 'Won', order: 5, color: '#10b981', probability: 100, targetDurationDays: 0 },
        ],
      });
      pipelines = [defaultPipeline];
    }
    return sendSuccess(res, 'Pipelines retrieved', pipelines);
  } catch (error) {
    next(error);
  }
};

export const listDeals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deals = await Deal.find({ createdBy: req.user?.userId }).populate('contactId', 'name phone email avatar');
    return sendSuccess(res, 'Deals retrieved', deals);
  } catch (error) {
    next(error);
  }
};

export const createDeal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deal = await Deal.create({
      ...req.body,
      createdBy: req.user?.userId,
    });
    return sendSuccess(res, 'Deal created', deal, 201);
  } catch (error) {
    next(error);
  }
};

export const moveDealStage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { stageId } = req.body;
    const deal = await Deal.findByIdAndUpdate(id, { stageId }, { new: true });
    return sendSuccess(res, 'Deal moved to stage', deal);
  } catch (error) {
    next(error);
  }
};

// --- TASKS ---
export const listTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tasks = await Task.find({ createdBy: req.user?.userId }).populate('contactId', 'name phone').sort({ dueDate: 1 });
    return sendSuccess(res, 'Tasks retrieved', tasks);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await Task.create({
      ...req.body,
      createdBy: req.user?.userId,
    });
    return sendSuccess(res, 'Task created', task, 201);
  } catch (error) {
    next(error);
  }
};

// --- NOTES ---
export const createNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const note = await Note.create({
      ...req.body,
      createdBy: req.user?.userId,
    });
    return sendSuccess(res, 'Note created', note, 201);
  } catch (error) {
    next(error);
  }
};
