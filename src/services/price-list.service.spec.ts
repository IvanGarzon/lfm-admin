import { describe, it, expect } from 'vitest';
import { calculateRetailPrice, hasCostChanged } from '@/services/price-list.service';

describe('price-list.service', () => {
  // ===========================================================================
  // calculateRetailPrice
  // ===========================================================================
  describe('calculateRetailPrice', () => {
    describe('basic calculation (no override)', () => {
      it('calculates retailPrice = costPerUnit × multiplier', () => {
        expect(
          calculateRetailPrice({
            costPerUnit: 10,
            multiplier: 3,
          }),
        ).toBe(30);
      });

      it('handles non-integer results with rounding', () => {
        expect(
          calculateRetailPrice({
            costPerUnit: 3.33,
            multiplier: 3,
          }),
        ).toBe(9.99);
      });

      it('returns 0 when costPerUnit is 0', () => {
        expect(
          calculateRetailPrice({
            costPerUnit: 0,
            multiplier: 3,
          }),
        ).toBe(0);
      });

      it('handles fractional multipliers', () => {
        expect(
          calculateRetailPrice({
            costPerUnit: 10,
            multiplier: 2.5,
          }),
        ).toBe(25);
      });
    });

    describe('with retailPriceOverride', () => {
      it('uses override when provided', () => {
        expect(
          calculateRetailPrice({
            costPerUnit: 10,
            multiplier: 3,
            retailPriceOverride: 25,
          }),
        ).toBe(25);
      });

      it('ignores override when null', () => {
        expect(
          calculateRetailPrice({
            costPerUnit: 10,
            multiplier: 3,
            retailPriceOverride: null,
          }),
        ).toBe(30);
      });

      it('ignores override when 0', () => {
        expect(
          calculateRetailPrice({
            costPerUnit: 10,
            multiplier: 3,
            retailPriceOverride: 0,
          }),
        ).toBe(30);
      });

      it('rounds override to 2 decimals', () => {
        expect(
          calculateRetailPrice({
            costPerUnit: 10,
            multiplier: 3,
            retailPriceOverride: 25.999,
          }),
        ).toBe(26);
      });
    });

    describe('edge cases', () => {
      it('throws error when multiplier is zero', () => {
        expect(() =>
          calculateRetailPrice({
            costPerUnit: 10,
            multiplier: 0,
          }),
        ).toThrow('Multiplier must be greater than zero');
      });

      it('throws error when multiplier is negative', () => {
        expect(() =>
          calculateRetailPrice({
            costPerUnit: 10,
            multiplier: -1,
          }),
        ).toThrow('Multiplier must be greater than zero');
      });

      it('handles large numbers correctly', () => {
        expect(
          calculateRetailPrice({
            costPerUnit: 333333.33,
            multiplier: 3,
          }),
        ).toBe(999999.99);
      });

      it('handles small fractional values', () => {
        expect(
          calculateRetailPrice({
            costPerUnit: 0.01,
            multiplier: 3,
          }),
        ).toBe(0.03);
      });
    });
  });

  // ===========================================================================
  // hasCostChanged
  // ===========================================================================
  describe('hasCostChanged', () => {
    it('returns false for identical values', () => {
      expect(hasCostChanged(10, 10)).toBe(false);
    });

    it('returns true for different values', () => {
      expect(hasCostChanged(10, 15)).toBe(true);
    });

    it('returns false for floating point values that round to same', () => {
      expect(hasCostChanged(10.001, 10.004)).toBe(false);
    });

    it('returns true for floating point values that round differently', () => {
      expect(hasCostChanged(10.001, 10.009)).toBe(true);
    });
  });
});
