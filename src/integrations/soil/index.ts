import axios, { AxiosError } from 'axios';
import { config } from '../../config';
import logger from '../../infrastructure/logger';

export interface SoilNutrientData {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicCarbon: number;
  moistureLevel: number;
  source: string;
}

/**
 * Fetch soil nutrient data from iSDA Africa Soil API using farm coordinates.
 * Falls back to realistic mock values in development.
 */
export async function fetchSoilData(
  latitude: number,
  longitude: number
): Promise<SoilNutrientData> {
  try {
    const response = await axios.get<Record<string, unknown>>(
      `${config.isda.apiUrl}/soilproperty`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          property: 'ph,nitrogen,phosphorus,potassium,carbon_organic',
          depth: '0-20cm',
        },
        headers: {
          Authorization: `Bearer ${config.isda.apiKey}`,
          Accept: 'application/json',
        },
        timeout: 15000,
      }
    );

    const d = response.data;

    logger.info(`[Soil] Data fetched for (${latitude}, ${longitude})`);

    return {
      ph: extractValue(d, 'ph') ?? 6.5,
      nitrogen: extractValue(d, 'nitrogen') ?? 0.3,
      phosphorus: extractValue(d, 'phosphorus') ?? 0.2,
      potassium: extractValue(d, 'potassium') ?? 0.4,
      organicCarbon: extractValue(d, 'carbon_organic') ?? 0.9,
      moistureLevel: extractValue(d, 'moisture') ?? 35,
      source: 'iSDA Africa Soil API',
    };
  } catch (err) {
    const axiosErr = err as AxiosError;
    logger.error(`[Soil] API error: ${axiosErr.message}`);

    if (config.server.isDevelopment || config.server.isTest) {
      logger.warn('[Soil] Returning mock soil data for development');
      return mockSoilData();
    }

    throw new Error('Soil data service is currently unavailable. Please try again later.');
  }
}

function extractValue(data: Record<string, unknown>, key: string): number | null {
  const v = data[key];
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v !== null) {
    const mean = (v as Record<string, unknown>)['mean'];
    if (typeof mean === 'number') return mean;
  }
  return null;
}

function mockSoilData(): SoilNutrientData {
  return {
    ph: 6.4,
    nitrogen: 0.28,
    phosphorus: 0.16,
    potassium: 0.42,
    organicCarbon: 0.87,
    moistureLevel: 36,
    source: 'iSDA Africa Soil API (Mock — Development Only)',
  };
}
