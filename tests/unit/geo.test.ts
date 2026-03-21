import { haversineDistance, isWithinRadius, parsePagination } from '../../src/utils/geo';

describe('Geo Utilities', () => {
  describe('haversineDistance', () => {
    it('returns ~0 for identical locations', () => {
      const loc = { latitude: 6.5244, longitude: 3.3792 };
      expect(haversineDistance(loc, loc)).toBeCloseTo(0, 3);
    });

    it('calculates correct distance between two Lagos points', () => {
      const islandLagos = { latitude: 6.5244, longitude: 3.3792 };
      const ikeja = { latitude: 6.6018, longitude: 3.3515 };
      const dist = haversineDistance(islandLagos, ikeja);
      // These two points are roughly 9–11km apart
      expect(dist).toBeGreaterThan(8);
      expect(dist).toBeLessThan(12);
    });

    it('calculates ~3475km between Lagos and Nairobi', () => {
      const lagos = { latitude: 6.5244, longitude: 3.3792 };
      const nairobi = { latitude: -1.2921, longitude: 36.8219 };
      const dist = haversineDistance(lagos, nairobi);
      expect(dist).toBeGreaterThan(3400);
      expect(dist).toBeLessThan(3600);
    });
  });

  describe('isWithinRadius', () => {
    const origin = { latitude: 6.5244, longitude: 3.3792 };

    it('returns true for a very close location', () => {
      const nearby = { latitude: 6.5250, longitude: 3.3800 };
      expect(isWithinRadius(origin, nearby, 10)).toBe(true);
    });

    it('returns false for a location far away', () => {
      const abuja = { latitude: 9.0579, longitude: 7.4951 };
      expect(isWithinRadius(origin, abuja, 10)).toBe(false);
    });

    it('returns true when exactly at radius boundary (within tolerance)', () => {
      // Point approximately 10km north of origin
      const atBoundary = { latitude: 6.6144, longitude: 3.3792 };
      expect(isWithinRadius(origin, atBoundary, 11)).toBe(true);
    });
  });

  describe('parsePagination', () => {
    it('returns defaults when no params provided', () => {
      const result = parsePagination(undefined, undefined);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(0);
    });

    it('calculates skip correctly', () => {
      const result = parsePagination('3', '10');
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(20);
    });

    it('caps limit at 100', () => {
      const result = parsePagination('1', '999');
      expect(result.limit).toBe(100);
    });

    it('enforces minimum page of 1', () => {
      const result = parsePagination('0', '10');
      expect(result.page).toBe(1);
      expect(result.skip).toBe(0);
    });
  });
});
