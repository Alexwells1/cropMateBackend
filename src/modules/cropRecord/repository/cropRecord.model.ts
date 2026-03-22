// ============================================================
// CropMate - CropRecord Model
//
// Schema changes:
//   clientId — optional frontend-generated idempotency key.
//
//   Idempotency strategy for records is different from farms/crops.
//   Records do not have a natural surrogate key visible to the client
//   before the server assigns _id, so we use the frontend's localId
//   as clientId, stored in a sparse unique index on (cropId, clientId).
//
//   A retry with the same clientId returns the existing record.
//   Records without clientId (direct API calls) are not deduplicated.
// ============================================================

import { Schema, model } from 'mongoose';
import { ICropRecord } from '../../../types';

export interface ICropRecordWithClientId extends ICropRecord {
  clientId?: string;
}

const cropRecordSchema = new Schema<ICropRecordWithClientId>(
  {
    cropId: {
      type: Schema.Types.ObjectId,
      ref: 'Crop',
      required: [true, 'cropId is required'],
      index: true,
    },
    activityType: {
      type: String,
      required: [true, 'Activity type is required'],
      enum: ['fertilizer', 'irrigation', 'pesticide', 'harvest', 'planting', 'weeding', 'other'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    quantity: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    activityDate: {
      type: Date,
      required: [true, 'Activity date is required'],
      default: Date.now,
    },
    // Optional client-generated idempotency key (frontend's localId).
    clientId: {
      type: String,
      index: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

cropRecordSchema.index({ cropId: 1, activityDate: -1 });
cropRecordSchema.index({ cropId: 1, activityType: 1 });

// Sparse unique index: (cropId, clientId) must be unique when clientId is set.
// Prevents duplicate records when RECORD_LOG is retried.
cropRecordSchema.index(
  { cropId: 1, clientId: 1 },
  {
    unique: true,
    sparse: true,
    name: 'cropId_clientId_unique',
  }
);

export const CropRecordModel = model<ICropRecordWithClientId>('CropRecord', cropRecordSchema);