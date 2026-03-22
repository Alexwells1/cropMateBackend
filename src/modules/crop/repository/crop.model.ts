// ============================================================
// CropMate - Crop Model
//
// Schema changes:
//   clientId — optional frontend-generated idempotency key.
//     Sparse unique index on (farmId, clientId) prevents duplicate
//     crops when CROP_CREATE is retried after a lost response.
//     Documents without clientId are excluded from the uniqueness
//     constraint (sparse: true).
// ============================================================

import { Schema, model } from 'mongoose';
import { ICrop } from '../../../types';

export interface ICropWithClientId extends ICrop {
  clientId?: string;
}

const cropSchema = new Schema<ICropWithClientId>(
  {
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'farmId is required'],
      index: true,
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
      minlength: [2, 'Crop name must be at least 2 characters'],
      maxlength: [100, 'Crop name cannot exceed 100 characters'],
    },
    plantingDate: {
      type: Date,
      required: [true, 'Planting date is required'],
    },
    fieldArea: {
      type: Number,
      required: [true, 'Field area is required'],
      min: [0.01, 'Field area must be positive'],
    },
    status: {
      type: String,
      enum: ['growing', 'harvested', 'failed', 'dormant'],
      default: 'growing',
    },
    expectedHarvestDate: {
      type: Date,
    },
    // Optional client-generated idempotency key.
    // Prevents duplicate crops when CROP_CREATE is retried.
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

cropSchema.index({ farmId: 1, status: 1 });
cropSchema.index({ farmId: 1, createdAt: -1 });

// Partial unique index: (farmId, clientId) must be unique when clientId is set.
cropSchema.index(
  { farmId: 1, clientId: 1 },
  {
    unique: true,
    sparse: true,
    name: 'farmId_clientId_unique',
  }
);

export const CropModel = model<ICropWithClientId>('Crop', cropSchema);