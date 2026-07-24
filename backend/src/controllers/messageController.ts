import { Response, NextFunction } from 'express';
import { MessageService } from '../services/messageService.js';
import { SpintaxProcessor } from '../utils/spintax.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuthRequest } from '../middleware/auth.js';

export const sendText = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, text, options } = req.body;
    if (!instanceId || !phone || !text) {
      return sendError(res, 'instanceId, phone, and text are required', 400);
    }
    const result = await MessageService.sendTextMessage(instanceId, phone, text, options);
    return sendSuccess(res, 'Text message dispatched', result);
  } catch (error) {
    next(error);
  }
};

export const sendImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, imageUrl, caption, options } = req.body;
    if (!instanceId || !phone || !imageUrl) {
      return sendError(res, 'instanceId, phone, and imageUrl are required', 400);
    }
    const result = await MessageService.sendImageMessage(instanceId, phone, imageUrl, caption, options);
    return sendSuccess(res, 'Image message dispatched', result);
  } catch (error) {
    next(error);
  }
};

export const sendVideo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, videoUrl, caption, options } = req.body;
    if (!instanceId || !phone || !videoUrl) {
      return sendError(res, 'instanceId, phone, and videoUrl are required', 400);
    }
    const result = await MessageService.sendVideoMessage(instanceId, phone, videoUrl, caption, options);
    return sendSuccess(res, 'Video message dispatched', result);
  } catch (error) {
    next(error);
  }
};

export const sendDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, docUrl, fileName, caption } = req.body;
    if (!instanceId || !phone || !docUrl || !fileName) {
      return sendError(res, 'instanceId, phone, docUrl, and fileName are required', 400);
    }
    const result = await MessageService.sendDocumentMessage(instanceId, phone, docUrl, fileName, caption);
    return sendSuccess(res, 'Document message dispatched', result);
  } catch (error) {
    next(error);
  }
};

export const sendAudio = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, audioUrl, options } = req.body;
    if (!instanceId || !phone || !audioUrl) {
      return sendError(res, 'instanceId, phone, and audioUrl are required', 400);
    }
    const result = await MessageService.sendAudioMessage(instanceId, phone, audioUrl, options);
    return sendSuccess(res, 'Audio message dispatched', result);
  } catch (error) {
    next(error);
  }
};

export const sendLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, latitude, longitude, name, address } = req.body;
    if (!instanceId || !phone || latitude === undefined || longitude === undefined) {
      return sendError(res, 'instanceId, phone, latitude, and longitude are required', 400);
    }
    const result = await MessageService.sendLocationMessage(instanceId, phone, latitude, longitude, name, address);
    return sendSuccess(res, 'Location message dispatched', result);
  } catch (error) {
    next(error);
  }
};

export const sendButtons = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, data } = req.body;
    if (!instanceId || !phone || !data || !data.text || !data.buttons) {
      return sendError(res, 'instanceId, phone, and button data are required', 400);
    }
    const result = await MessageService.sendButtonMessage(instanceId, phone, data);
    return sendSuccess(res, 'Interactive buttons dispatched', result);
  } catch (error) {
    next(error);
  }
};

export const sendList = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, data } = req.body;
    if (!instanceId || !phone || !data || !data.title || !data.sections) {
      return sendError(res, 'instanceId, phone, and list data are required', 400);
    }
    const result = await MessageService.sendListMessage(instanceId, phone, data);
    return sendSuccess(res, 'List menu dispatched', result);
  } catch (error) {
    next(error);
  }
};

export const sendMediaButtons = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, data } = req.body;
    if (!instanceId || !phone || !data || !data.mediaUrl) {
      return sendError(res, 'instanceId, phone, and media data are required', 400);
    }
    const result = await MessageService.sendMediaWithButtons(instanceId, phone, data);
    return sendSuccess(res, 'Media buttons dispatched', result);
  } catch (error) {
    next(error);
  }
};

export const sendCarousel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, cards } = req.body;
    if (!instanceId || !phone || !cards || !Array.isArray(cards)) {
      return sendError(res, 'instanceId, phone, and cards array are required', 400);
    }
    const result = await MessageService.sendCarouselMessage(instanceId, phone, cards);
    return sendSuccess(res, 'Carousel cards dispatched', result);
  } catch (error) {
    next(error);
  }
};

export const verifyNumber = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone } = req.body;
    if (!instanceId || !phone) {
      return sendError(res, 'instanceId and phone are required', 400);
    }
    const result = await MessageService.verifyNumber(instanceId, phone);
    return sendSuccess(res, 'WhatsApp number verified', result);
  } catch (error) {
    next(error);
  }
};

export const sendTest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, messageData } = req.body;
    if (!instanceId || !phone || !messageData) {
      return sendError(res, 'instanceId, phone, and messageData are required', 400);
    }
    const result = await MessageService.sendTestMessage(instanceId, phone, messageData);
    return sendSuccess(res, 'Test message sent successfully', result);
  } catch (error) {
    next(error);
  }
};

export const previewMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { text, contactData, count } = req.body;
    if (!text) {
      return sendError(res, 'text is required for preview', 400);
    }

    const compiledSingle = SpintaxProcessor.compileMessage(text, contactData || {});
    const variations = SpintaxProcessor.getPreview(text, count || 5);
    const isValidSyntax = SpintaxProcessor.validate(text);

    return sendSuccess(res, 'SpinTax preview generated', {
      isValidSyntax,
      singleCompiled: compiledSingle,
      variations,
    });
  } catch (error) {
    next(error);
  }
};

export const sendOTP = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, otp, header, body, footer, buttonText, template, isAutoGenerated } = req.body;
    if (!instanceId || !phone) {
      return sendError(res, 'instanceId and phone are required', 400);
    }

    // Auto-generate OTP if not provided
    let finalOtp = otp;
    if (!finalOtp) {
      const length = req.body.length === 4 ? 4 : 6;
      finalOtp = Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1)).toString();
    }

    const { BaileysEngine } = await import('../services/baileysEngine.js');
    const result = await BaileysEngine.sendOTP(instanceId, phone, {
      otp: finalOtp,
      header,
      body,
      footer,
      buttonText,
      template,
      isAutoGenerated: !otp || isAutoGenerated,
    });

    return sendSuccess(res, `OTP ${finalOtp} sent successfully`, { ...result, otp: finalOtp });
  } catch (error) {
    next(error);
  }
};

export const sendReaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, phone, messageId, emoji } = req.body;
    if (!instanceId || !phone || !messageId || !emoji) {
      return sendError(res, 'instanceId, phone, messageId, and emoji are required', 400);
    }

    const { BaileysEngine } = await import('../services/baileysEngine.js');
    const result = await BaileysEngine.sendReaction(instanceId, phone, messageId, emoji);
    return sendSuccess(res, `Reaction ${emoji} sent`, result);
  } catch (error) {
    next(error);
  }
};

export const postStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, type, text, mediaUrl, backgroundColor, font } = req.body;
    if (!instanceId) {
      return sendError(res, 'instanceId is required', 400);
    }

    const { BaileysEngine } = await import('../services/baileysEngine.js');
    let result;
    if (type === 'image' || mediaUrl) {
      result = await BaileysEngine.postImageStatus(instanceId, { mediaUrl, caption: text });
    } else {
      result = await BaileysEngine.postTextStatus(instanceId, { text, backgroundColor, font });
    }

    return sendSuccess(res, 'WhatsApp Status posted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { BaileysEngine } = await import('../services/baileysEngine.js');
    const groups = await BaileysEngine.getAllGroups(id);
    return sendSuccess(res, 'WhatsApp Groups retrieved', groups);
  } catch (error) {
    next(error);
  }
};

export const getGroupMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, groupJid } = req.params;
    const { BaileysEngine } = await import('../services/baileysEngine.js');
    const data = await BaileysEngine.getGroupMembers(id, groupJid);
    return sendSuccess(res, 'Group members retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const syncGroupToContacts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, groupJid } = req.params;
    const { tagName, onlyAdmins } = req.body;
    const { BaileysEngine } = await import('../services/baileysEngine.js');
    const result = await BaileysEngine.syncGroupToContacts(id, groupJid, { tagName, onlyAdmins });
    return sendSuccess(res, `Synced ${result.totalMembers} members into Contacts`, result);
  } catch (error) {
    next(error);
  }
};
