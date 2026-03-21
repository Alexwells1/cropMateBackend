import { Types } from 'mongoose';
import { SoilDataModel } from '../repository/soilData.model';
import { verifyFarmOwnership } from '../../farm/service/farm.service';
import { ISoilData } from '../../../types';
import { fetchSoilData } from '../../../integrations/soil';
import { fetchWeather } from '../../../integrations/weather';
import { cacheGet, cacheSet } from '../../../infrastructure/cache/redis';
import logger from '../../../infrastructure/logger';

export interface SoilInsightResult {
  soilData: ISoilData;
  fertilizerRecommendation: string;
  irrigationAdvice: string;
  weather: {
    temperature: number;
    humidity: number;
    rainfall: number;
    description: string;
  } | null;
}

export async function getSoilInsights(
  farmId: string,
  userId: string
): Promise<SoilInsightResult> {
  const farm = await verifyFarmOwnership(farmId, userId);

  const cacheKey = `soil:${farmId}`;
  const cached = await cacheGet<ISoilData>(cacheKey);

  let soilData: ISoilData;

  if (cached) {
    soilData = cached;
    logger.info(`[Soil] Cache hit for farm: ${farmId}`);
  } else {
    const fetched = await fetchSoilData(farm.location.latitude, farm.location.longitude);
    const saved = await SoilDataModel.create({
      farmId: new Types.ObjectId(farmId),
      ph: fetched.ph,
      nitrogen: fetched.nitrogen,
      phosphorus: fetched.phosphorus,
      potassium: fetched.potassium,
      organicCarbon: fetched.organicCarbon,
      moistureLevel: fetched.moistureLevel,
      source: fetched.source,
    });

    soilData = saved as ISoilData;
    await cacheSet(cacheKey, soilData, 3600); // 1 hour
    logger.info(`[Soil] Fresh data fetched and cached for farm: ${farmId}`);
  }

  // Fetch weather (non-fatal)
  let weather: SoilInsightResult['weather'] = null;
  try {
    const w = await fetchWeather(farm.location.latitude, farm.location.longitude);
    weather = {
      temperature: w.temperature,
      humidity: w.humidity,
      rainfall: w.rainfall,
      description: w.description,
    };
  } catch {
    logger.warn('[Soil] Weather data unavailable — skipping');
  }

  return {
    soilData,
    fertilizerRecommendation: buildFertilizerAdvice(soilData),
    irrigationAdvice: buildIrrigationAdvice(soilData, weather?.rainfall ?? 0),
    weather,
  };
}

function buildFertilizerAdvice(soil: ISoilData): string {
  const tips: string[] = [];

  if (soil.ph < 5.5) {
    tips.push('⚠️ Soil is too acidic. Apply agricultural lime at 2 t/ha to raise pH.');
  } else if (soil.ph > 7.5) {
    tips.push('⚠️ Soil is too alkaline. Apply sulfur or acidifying fertilizer to lower pH.');
  } else {
    tips.push('✅ Soil pH is in a healthy range (5.5–7.5).');
  }

  if (soil.nitrogen < 0.2) {
    tips.push('🔴 Nitrogen is low — apply Urea (46-0-0) at 50 kg/ha or CAN at 60 kg/ha.');
  } else if (soil.nitrogen < 0.35) {
    tips.push('🟡 Nitrogen is moderate — a light top-dress of CAN (25 kg/ha) is beneficial.');
  } else {
    tips.push('✅ Nitrogen levels are sufficient.');
  }

  if (soil.phosphorus < 0.15) {
    tips.push('🔴 Phosphorus is low — apply Single Super Phosphate (SSP) at 40 kg/ha.');
  } else {
    tips.push('✅ Phosphorus levels are sufficient.');
  }

  if (soil.potassium < 0.3) {
    tips.push('🔴 Potassium is low — apply Muriate of Potash (MOP) at 25 kg/ha.');
  } else {
    tips.push('✅ Potassium levels are sufficient.');
  }

  if (soil.organicCarbon < 0.5) {
    tips.push('ℹ️ Organic carbon is low. Consider adding compost or crop residue incorporation.');
  }

  return tips.join(' ');
}

function buildIrrigationAdvice(soil: ISoilData, rainfallMm: number): string {
  if (rainfallMm > 20) {
    return '🌧️ Significant rainfall recorded. Skip irrigation for the next 2–3 days and monitor soil moisture.';
  }

  const m = soil.moistureLevel;
  if (m < 20) return '🚨 Soil moisture is critically low. Irrigate immediately — apply 25–35mm of water.';
  if (m < 35) return '🟡 Soil moisture is low. Irrigate every 2–3 days with 15–20mm per session.';
  if (m < 60) return '✅ Soil moisture is adequate. Irrigate every 5–7 days as needed.';
  return '💧 Soil moisture is high. Hold irrigation to prevent waterlogging and root rot.';
}
