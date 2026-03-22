// ============================================================
// CropMate - Farm Model
//
// Schema changes:
//   clientId — optional frontend-generated idempotency key.
//   Sparse unique index on (userId, clientId) prevents duplicate
//   farms when FARM_CREATE is retried after a lost response.
// ============================================================

import { Schema, model } from 'mongoose';
import { IFarm } from '../../../types';

export interface IFarmWithClientId extends IFarm {
  clientId?: string;
}

const farmSchema = new Schema<IFarmWithClientId>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    farmName: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
      minlength: [2, 'Farm name must be at least 2 characters'],
      maxlength: [150, 'Farm name cannot exceed 150 characters'],
    },
    farmSize: {
      type: Number,
      required: [true, 'Farm size is required'],
      min: [0.01, 'Farm size must be positive'],
    },
    location: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
    },
    soilType: {
      type: String,
      enum: ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky', 'Unknown'],
      default: 'Unknown',
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

farmSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Sparse unique index: (userId, clientId) — only applies when clientId is set.
farmSchema.index(
  { userId: 1, clientId: 1 },
  { unique: true, sparse: true, name: 'userId_clientId_farm_unique' }
);

export const FarmModel = model<IFarmWithClientId>('Farm', farmSchema);