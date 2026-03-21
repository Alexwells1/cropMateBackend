import axios, { AxiosError } from 'axios';
import { config } from '../../config';
import logger from '../../infrastructure/logger';

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  description: string;
  feelsLike: number;
  iconCode: string;
}

export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  try {
    const response = await axios.get<Record<string, unknown>>(
      `${config.openWeather.apiUrl}/weather`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: config.openWeather.apiKey,
          units: 'metric',
        },
        timeout: 10000,
      }
    );

    const d = response.data;
    const main = d['main'] as Record<string, number>;
    const weatherArr = d['weather'] as Array<Record<string, string>>;
    const wind = d['wind'] as Record<string, number>;
    const rain = d['rain'] as Record<string, number> | undefined;
    const w = weatherArr[0] ?? {};

    logger.info(`[Weather] Fetched for (${latitude}, ${longitude})`);

    return {
      temperature: main['temp'] ?? 0,
      humidity: main['humidity'] ?? 0,
      feelsLike: main['feels_like'] ?? 0,
      rainfall: rain?.['1h'] ?? 0,
      windSpeed: wind['speed'] ?? 0,
      description: w['description'] ?? 'N/A',
      iconCode: w['icon'] ?? '',
    };
  } catch (err) {
    const axiosErr = err as AxiosError;
    logger.error(`[Weather] API error: ${axiosErr.message}`);

    if (config.server.isDevelopment || config.server.isTest) {
      logger.warn('[Weather] Returning mock data for development');
      return { temperature: 29, humidity: 70, rainfall: 0, windSpeed: 3.2, description: 'Partly cloudy', feelsLike: 31, iconCode: '02d' };
    }

    throw new Error('Weather service is currently unavailable.');
  }
}
