import { describe, it, expect, vi } from 'vitest';
import { formatPrice, convertFromUSD, KHR_RATES } from '../../../src/utils/format';

// Mock the settings store
vi.mock('../../../src/stores/settings', () => ({
  useSettingsStore: () => ({
    config: {
      localization: {
        currency: 'USD'
      }
    }
  })
}));

describe('Currency Utilities', () => {
  describe('convertFromUSD', () => {
    it('should return the same amount for USD', () => {
      expect(convertFromUSD(100, 'USD')).toBe(100);
    });

    it('should convert USD to KHR correctly', () => {
      const amount = 10; // $10
      const expected = amount * KHR_RATES.USD;
      expect(convertFromUSD(amount, 'KHR')).toBe(expected);
    });

    it('should convert USD to CNY correctly', () => {
      const amount = 10; // $10
      const expected = (amount * KHR_RATES.USD) / KHR_RATES.CNY;
      expect(convertFromUSD(amount, 'CNY')).toBe(expected);
    });
  });

  describe('formatPrice', () => {
    it('should format USD correctly', () => {
      // Default is USD from mock
      expect(formatPrice(10.5)).toBe('$10.50');
    });

    it('should format KHR with the correct symbol', () => {
      expect(formatPrice(4000, 'KHR')).toContain('៛');
    });

    it('should handle zero or null gracefully', () => {
      expect(formatPrice(0)).toBe('$0.00');
      expect(formatPrice(null)).toBe('$0.00');
    });
  });
});
