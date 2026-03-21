import { EventEmitter } from 'events';
import logger from '../logger';

// ── Event Names ───────────────────────────────────────────────
export type CropMateEventName =
  | 'disease.detected'
  | 'alert.created'
  | 'farm.created'
  | 'crop.harvested'
  | 'notification.send';

// ── Payload Types ─────────────────────────────────────────────
export interface DiseaseDetectedPayload {
  detectionId: string;
  farmId: string;
  cropId: string;
  userId: string;
  diseaseName: string;
  severity: 'low' | 'medium' | 'high';
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface FarmCreatedPayload {
  farmId: string;
  userId: string;
}

type EventPayloadMap = {
  'disease.detected': DiseaseDetectedPayload;
  'alert.created': { alertId: string };
  'farm.created': FarmCreatedPayload;
  'crop.harvested': { cropId: string; farmId: string };
  'notification.send': { userId: string; title: string; message: string };
};

// ── Typed Event Bus ───────────────────────────────────────────
class CropMateEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(30);
  }

  public publish<T extends CropMateEventName>(
    event: T,
    payload: EventPayloadMap[T]
  ): boolean {
    logger.debug(`[EventBus] Publishing: ${event}`);
    return super.emit(event, payload);
  }

  public subscribe<T extends CropMateEventName>(
    event: T,
    handler: (payload: EventPayloadMap[T]) => void | Promise<void>
  ): this {
    logger.debug(`[EventBus] Subscribed to: ${event}`);
    return super.on(event, handler as (...args: unknown[]) => void);
  }
}

export const eventBus = new CropMateEventBus();
