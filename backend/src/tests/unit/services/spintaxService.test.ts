import { SpintaxProcessor } from '../../../utils/spintax.js';

describe('SpintaxProcessor Unit Tests', () => {
  test('Empty input returns empty string', () => {
    expect(SpintaxProcessor.process('')).toBe('');
  });

  test('Simple SpinTax choice is resolved correctly', () => {
    const text = '{hello|hi|hey}';
    const result = SpintaxProcessor.process(text);
    expect(['hello', 'hi', 'hey']).toContain(result);
  });

  test('Nested SpinTax is resolved recursively', () => {
    const text = 'Welcome {friend|user {name|customer}}!';
    const result = SpintaxProcessor.process(text);
    expect(
      result === 'Welcome friend!' ||
      result === 'Welcome user name!' ||
      result === 'Welcome user customer!'
    ).toBe(true);
  });

  test('Validate returns true for balanced braces', () => {
    expect(SpintaxProcessor.validate('Hello {world|there}')).toBe(true);
    expect(SpintaxProcessor.validate('Hello {world|{there|everybody}}')).toBe(true);
  });

  test('Validate returns false for unbalanced braces', () => {
    expect(SpintaxProcessor.validate('Hello {world')).toBe(false);
    expect(SpintaxProcessor.validate('Hello world}')).toBe(false);
    expect(SpintaxProcessor.validate('Hello {world|there}}')).toBe(false);
  });

  test('replaceVariables swaps standard placeholders', () => {
    const text = 'Hello {{firstName}} {{lastName}} from {{city}}!';
    const contact = { name: 'John Doe', city: 'Delhi', phone: '919876543210' };
    const result = SpintaxProcessor.replaceVariables(text, contact);
    expect(result).toBe('Hello John Doe from Delhi!');
  });
});
