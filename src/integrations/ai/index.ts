import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import { config } from '../../config';
import logger from '../../infrastructure/logger';

export interface AIDetectionResult {
  disease: string;
  confidence: number;
  treatment: string;
  preventionAdvice: string;
  severity: 'low' | 'medium' | 'high';
  isHealthy: boolean;
}

interface AIServiceResponse {
  prediction: string;
  disease: string;
  confidence: number;
  isHealthy: boolean;
  severity: 'low' | 'medium' | 'high';
  treatment: string;
  preventionAdvice: string;
}

/**
 * detectDisease
 * ──────────────
 * Sends the image to the FastAPI AI service for disease classification.
 *
 * cropName (e.g. "Tomato", "Corn") is passed to enable constrained inference —
 * the model will only consider disease classes that belong to that crop,
 * significantly improving accuracy by eliminating impossible predictions.
 *
 * Two strategies tried in order:
 *  1. URL mode  — POST /detect with Cloudinary URL + cropName (JSON)
 *  2. Upload mode — POST /detect/upload with raw buffer + cropName (multipart)
 */
export async function detectDisease(
  imageUrl: string,
  cropName?: string,
  imageBuffer?: Buffer,
): Promise<AIDetectionResult> {
  // ── Strategy 1: URL-based detection ──────────────────────────────────────
  try {
    const response = await axios.post<AIServiceResponse>(
      `${config.ai.serviceUrl}/detect`,
      {
        imageUrl,
        cropName: cropName ?? null,   // null = no filtering, use all 38 classes
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: config.ai.timeoutMs,
      },
    );

    logger.info(
      `[AI] Detection via URL completed — disease: ${response.data.disease}` +
      (cropName ? ` (constrained to: ${cropName})` : ' (unconstrained)'),
    );
    return mapResponse(response.data);
  } catch (urlErr) {
    const axiosErr = urlErr as AxiosError;
    logger.error(`[AI] 422 detail: ${JSON.stringify(axiosErr.response?.data)}`);
    logger.warn(`[AI] URL-mode detection failed: ${axiosErr.message}`);

    // ── Strategy 2: buffer upload fallback ───────────────────────────────────
    if (imageBuffer) {
      try {
        const form = new FormData();
        form.append('file', imageBuffer, {
          filename: 'leaf.jpg',
          contentType: 'image/jpeg',
        });
        // cropName as a form field so the upload endpoint can also filter
        if (cropName) {
          form.append('cropName', cropName);
        }

        const response = await axios.post<AIServiceResponse>(
          `${config.ai.serviceUrl}/detect/upload`,
          form,
          {
            headers: form.getHeaders(),
            timeout: config.ai.timeoutMs,
          },
        );

        logger.info(
          `[AI] Detection via upload fallback — disease: ${response.data.disease}` +
          (cropName ? ` (constrained to: ${cropName})` : ''),
        );
        return mapResponse(response.data);
      } catch (uploadErr) {
        const uploadAxiosErr = uploadErr as AxiosError;
        logger.error(`[AI] Upload-mode also failed: ${uploadAxiosErr.message}`);
      }
    }
  }

  // ── Dev / test mock ───────────────────────────────────────────────────────
  if (config.server.isDevelopment || config.server.isTest) {
    logger.warn('[AI] Returning mock detection result for development');
    return mockDetectionResult(cropName);
  }

  throw new Error(
    'AI detection service is currently unavailable. Please try again later.',
  );
}

function mapResponse(data: AIServiceResponse): AIDetectionResult {
  return {
    disease: data.disease,
    confidence: data.confidence,
    isHealthy: data.isHealthy,
    severity: data.severity,
    treatment: data.treatment,
    preventionAdvice: data.preventionAdvice,
  };
}

function mockDetectionResult(cropName?: string): AIDetectionResult {
  // Return a mock relevant to the crop if known
  const isTomato = cropName?.toLowerCase() === 'tomato';
  return {
    disease: isTomato ? 'Tomato Early Blight' : 'Pepper Bacterial Spot',
    confidence: 0.91,
    isHealthy: false,
    severity: 'medium',
    treatment:
      'Apply chlorothalonil (Daconil) or mancozeb fungicide on a 7–10 day schedule. ' +
      'Remove and destroy infected lower leaves. Mulch around the base to reduce soil splash.',
    preventionAdvice:
      'Use a 2-year crop rotation away from solanaceous crops. ' +
      'Use drip or furrow irrigation — avoid wetting foliage. ' +
      'Space plants 45–60 cm apart for adequate airflow.',
  };
}