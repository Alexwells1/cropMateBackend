// ============================================================
// CropMate - Crop Model
//
// Schema changes:
//   clientId — optional frontend-generated idempotency key.
//     Partial unique index on (farmId, clientId) prevents duplicate
//     crops when CROP_CREATE is retried after a lost response.
//     Uses partialFilterExpression instead of sparse: true so that
//     only documents where clientId EXISTS are included — multiple
//     documents with no clientId on the same farm are allowed.
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

// Partial unique index: only enforced when clientId is present.
// Unlike sparse: true, partialFilterExpression with $exists guarantees
// that documents without clientId (null or missing) are excluded entirely,
// so multiple seed/API crops on the same farm never conflict.
cropSchema.index(
  { farmId: 1, clientId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientId: { $exists: true, $type: 'string' } },
    name: 'farmId_clientId_unique',
  }
);

export const CropModel = model<ICropWithClientId>('Crop', cropSchema);