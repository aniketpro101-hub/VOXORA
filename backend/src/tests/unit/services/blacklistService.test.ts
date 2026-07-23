import { BlacklistEngine } from '../../../services/blacklistService.js';
import { OptOutKeyword } from '../../../models/OptOutKeyword.js';
import { BlacklistNumber } from '../../../models/BlacklistNumber.js';
import { Contact } from '../../../models/Contact.js';
import { BlacklistAction } from '../../../models/BlacklistAction.js';

// Mock the model methods directly on the imported classes
OptOutKeyword.find = jest.fn().mockResolvedValue([]);
BlacklistNumber.findOne = jest.fn().mockResolvedValue(null);
BlacklistNumber.create = jest.fn().mockResolvedValue({});
Contact.updateMany = jest.fn().mockResolvedValue({});
BlacklistAction.create = jest.fn().mockResolvedValue({});

jest.mock('../../../services/messageService.js', () => ({
  MessageService: {
    sendTextMessage: jest.fn().mockResolvedValue({}),
  },
}));

describe('BlacklistEngine Unit Tests', () => {
  test('analyzeIncomingMessage identifies opt-out keyword stop', async () => {
    const result = await BlacklistEngine.analyzeIncomingMessage('919876543210', 'Please stop sending messages');
    expect(result.shouldBan).toBe(true);
    expect(result.category).toBe('opt_out');
  });

  test('analyzeIncomingMessage identifies angry keyword spam', async () => {
    const result = await BlacklistEngine.analyzeIncomingMessage('919876543210', 'This is spam, I will report you to police');
    expect(result.shouldBan).toBe(true);
    expect(result.category).toBe('angry');
  });

  test('analyzeIncomingMessage returns false for normal message', async () => {
    const result = await BlacklistEngine.analyzeIncomingMessage('919876543210', 'Interested, please share details');
    expect(result.shouldBan).toBe(false);
  });
});
