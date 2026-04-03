// ============================================================
// CropMate — DiseaseDetection Model
//
// Index notes
// ───────────
// Sparse unique (userId, clientId):
//   clientId is a frontend-generated idempotency key (localDetectionId).
//   The service checks for an existing record with this key BEFORE
//   uploading to Cloudinary, so duplicate retries are short-circuited
//   before the expensive upload happens.
//
//   Sparse = rows without clientId are excluded from the unique constraint,
//   so older detections recorded without a clientId never conflict.
//
// IMPORTANT — first deploy:
//   The old index "userId_clientId_detecton..." (corrupted name) must be
//   dropped manually before starting the server, otherwise Mongoose will
//   error on startup trying to create the new index.
//
//   In mongosh:
//     use <your-db>
//     db.diseasedetections.getIndexes()          // find the corrupted name
//     db.diseasedetections.dropIndex("<name>")   // drop it
//   Then restart — Mongoose will recreate it with the correct name below.
// ============================================================

import { Schema, model } from 'mongoose';
import { IDiseaseDetection } from '../../../types';

export interface IDiseaseDetectionWithClientId extends IDiseaseDetection {
  clientId?: string;
}

const diseaseDetectionSchema = new Schema<IDiseaseDetectionWithClientId>(
  {
    // ── Relations ──────────────────────────────────────────
    cropId: {
      type: Schema.Types.ObjectId,
      ref: 'Crop',
      required: [true, 'cropId is required'],
      index: true,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'farmId is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },

    // ── Image ──────────────────────────────────────────────
    imageUrl: {
      type:     String,
      required: [true, 'imageUrl is required'],
    },
    publicId: {
      type:     String,
      required: [true, 'publicId is required'],
    },

    // ── AI result ──────────────────────────────────────────
    detectedDisease: {
      type:     String,
      required: [true, 'detectedDisease is required'],
      trim:     true,
    },
    confidenceScore: {
      type:     Number,
      required: [true, 'confidenceScore is required'],
      min:      0,
      max:      1,
    },
    treatment: {
      type:     String,
      required: [true, 'treatment is required'],
      trim:     true,
    },
    preventionAdvice: {
      type:     String,
      required: [true, 'preventionAdvice is required'],
      trim:     true,
    },
    severity: {
      type:     String,
      enum:     ['low', 'medium', 'high'],
      required: true,
    },
    isHealthy: {
      type:     Boolean,
      required: true,
      default:  false,
    },

    // ── Timestamps ─────────────────────────────────────────
    detectedAt: {
      type:    Date,
      default: Date.now,
    },

    // ── Idempotency ────────────────────────────────────────
    // Optional client-generated key (frontend's localDetectionId).
    // Prevents duplicate Cloudinary uploads on SCAN_UPLOAD retry.
    clientId: {
      type:   String,
      sparse: true,  // null/undefined rows excluded from unique index
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ── Compound query indexes ──────────────────────────────────
diseaseDetectionSchema.index({ farmId: 1, detectedAt: -1 });
diseaseDetectionSchema.index({ cropId: 1, detectedAt: -1 });

// ── Idempotency index ───────────────────────────────────────
// Sparse: skips documents where clientId is null/undefined.
// Name is explicit so it is stable across schema rebuilds.
diseaseDetectionSchema.index(
  { userId: 1, clientId: 1 },
  {
    unique: true,
    sparse: true,
    name:   'userId_clientId_detection_unique',
  },
);

export const DiseaseDetectionModel = model<IDiseaseDetectionWithClientId>(
  'DiseaseDetection',
  diseaseDetectionSchema,
);