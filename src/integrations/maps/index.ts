import { ILocation } from '../../types';
import { haversineDistance } from '../../utils/geo';

export interface NearbyFarmResult {
  farmId: string;
  userId: string;
  distanceKm: number;
  location: ILocation;
}

/**
 * Filter a list of farms to only those within radiusKm of the epicentre.
 */
export function filterNearbyFarms(
  epicentre: ILocation,
  farms: Array<{ _id: { toString(): string }; userId: { toString(): string }; location: ILocation }>,
  radiusKm: number
): NearbyFarmResult[] {
  return farms
    .map((farm) => ({
      farmId: farm._id.toString(),
      userId: farm.userId.toString(),
      distanceKm: haversineDistance(epicentre, farm.location),
      location: farm.location,
    }))
    .filter((f) => f.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
