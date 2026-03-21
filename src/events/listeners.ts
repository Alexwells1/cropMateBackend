import { eventBus, DiseaseDetectedPayload } from '../infrastructure/events/eventBus';
import { createOutbreakAlert } from '../modules/alert/service/alert.service';
import logger from '../infrastructure/logger';

export function registerEventListeners(): void {
  /**
   * When a disease is detected, automatically create a geo-based
   * outbreak alert and notify all nearby farmers.
   */
  eventBus.subscribe('disease.detected', async (payload: DiseaseDetectedPayload) => {
    try {
      logger.info(
        `[Event] disease.detected — triggering outbreak alert for: "${payload.diseaseName}"`
      );
      await createOutbreakAlert(payload);
    } catch (err) {
      // Non-fatal — alert failure should not impact the detection response
      logger.error('[Event] Failed to create outbreak alert:', err);
    }
  });

  logger.info('[Events] All event listeners registered');
}
