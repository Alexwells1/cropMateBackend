import { ILocation } from '../types';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Haversine formula — returns distance between two coordinates in kilometres.
 */
export function haversineDistance(a: ILocation, b: ILocation): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const chord =
    sinDLat * sinDLat +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * sinDLon * sinDLon;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

/**
 * Returns true if target is within radiusKm of origin.
 */
export function isWithinRadius(origin: ILocation, target: ILocation, radiusKm: number): boolean {
  return haversineDistance(origin, target) <= radiusKm;
}

/**
 * Parse page/limit query params safely.
 */
export function parsePagination(
  page: string | undefined,
  limit: string | undefined
): { page: number; limit: number; skip: number } {
  const p = Math.max(1, parseInt(page ?? '1', 10));
  const l = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10)));
  return { page: p, limit: l, skip: (p - 1) * l };
}
