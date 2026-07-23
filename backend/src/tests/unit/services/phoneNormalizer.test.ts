import { PhoneNormalizer } from '../../../utils/phoneNormalizer.js';

describe('PhoneNormalizer Unit Tests', () => {
  test('Standard Indian number is normalized correctly', () => {
    const raw = '+91 98765 43210';
    expect(PhoneNormalizer.normalize(raw)).toBe('919876543210');
  });

  test('Number without country code fallback to IN', () => {
    const raw = '9876543210';
    expect(PhoneNormalizer.normalize(raw)).toBe('919876543210');
  });

  test('Invalid format returns digits fallback or null', () => {
    expect(PhoneNormalizer.normalize('abc')).toBeNull();
  });

  test('US number gets correctly normalized', () => {
    const raw = '+1 202-555-0143';
    expect(PhoneNormalizer.normalize(raw, 'US')).toBe('12025550143');
  });

  test('detectCountry accurately identifies country codes', () => {
    expect(PhoneNormalizer.detectCountry('919876543210').name).toBe('India');
    expect(PhoneNormalizer.detectCountry('12025550143').name).toBe('USA / Canada');
    expect(PhoneNormalizer.detectCountry('447911123456').name).toBe('United Kingdom');
  });
});
