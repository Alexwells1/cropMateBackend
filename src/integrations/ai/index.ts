import { Client } from '@gradio/client';
import axios, { AxiosError } from 'axios';
import logger from '../../infrastructure/logger';

export interface AIDetectionResult {
  disease:          string;
  confidence:       number;
  treatment:        string;
  preventionAdvice: string;
  severity:         'low' | 'medium' | 'high';
  isHealthy:        boolean;
}

interface AIServicePayload {
  prediction:       string;
  disease:          string;
  confidence:       number;
  isHealthy:        boolean;
  severity:         'low' | 'medium' | 'high';
  treatment:        string;
  preventionAdvice: string;
  error?:           string;
}

export async function detectDisease(
  imageUrl:     string,
  cropName?:    string,
  imageBuffer?: Buffer,
): Promise<AIDetectionResult> {

  // ── Step 1: ensure we have a buffer ──────────────────────
  let buffer = imageBuffer;

  if (!buffer) {
    logger.info('[AI] No buffer supplied — fetching image from Cloudinary URL');
    try {
      const res = await axios.get<ArrayBuffer>(imageUrl, {
        responseType: 'arraybuffer',
        timeout:      10_000,
      });
      buffer = Buffer.from(res.data);
      logger.info('[AI] Image fetched from Cloudinary successfully');
    } catch (fetchErr) {
      const err = fetchErr as AxiosError;
      // Hard throw — no buffer means we cannot call the model at all
      throw new Error(`[AI] Failed to fetch image from Cloudinary: ${err.message}`);
    }
  }

  // ── Step 2: call the Space via @gradio/client ─────────────
  const blob   = new Blob([buffer], { type: 'image/jpeg' });
  const client = await Client.connect('mikunops/cropmate-ai', {
    // hf_token: config.ai.apiKey as `hf_${string}`,  // uncomment if Space is private
  });

  const result = await client.predict('/predict_image', {
    image:     blob,
    crop_name: cropName || null,
  });

  // result.data is always an array — [0] is the actual payload dict
  const payload = (result.data as unknown[])[0] as AIServicePayload;

  logger.info(`[AI] Raw Gradio response: ${JSON.stringify(payload)}`);

  if (!payload || typeof payload !== 'object') {
    throw new Error(`[AI] Unexpected Gradio response shape: ${JSON.stringify(result.data)}`);
  }

  if (payload.error) {
    throw new Error(`[AI] Model returned error: ${payload.error}`);
  }

  if (!payload.disease || payload.confidence === undefined) {
    throw new Error(`[AI] Incomplete payload from model: ${JSON.stringify(payload)}`);
  }

  logger.info(
    `[AI] Detection completed — disease: "${payload.disease}", ` +
    `confidence: ${payload.confidence}` +
    (cropName ? `, constrained to: ${cropName}` : ' (unconstrained)'),
  );

  return {
    disease:          payload.disease,
    confidence:       payload.confidence,
    isHealthy:        payload.isHealthy,
    severity:         payload.severity,
    treatment:        payload.treatment,
    preventionAdvice: payload.preventionAdvice,
  };
}