import { Schema, model } from 'mongoose';
import { ISoilData } from '../../../types';

const soilDataSchema = new Schema<ISoilData>(
  {
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'farmId is required'],
      index: true,
    },
    ph: { type: Number, required: true, min: 0, max: 14 },
    nitrogen: { type: Number, required: true, min: 0 },
    phosphorus: { type: Number, required: true, min: 0 },
    potassium: { type: Number, required: true, min: 0 },
    organicCarbon: { type: Number, required: true, min: 0 },
    moistureLevel: { type: Number, required: true, min: 0, max: 100 },
    source: { type: String, required: true, trim: true },
    recordedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

soilDataSchema.index({ farmId: 1, recordedAt: -1 });

export const SoilDataModel = model<ISoilData>('SoilData', soilDataSchema);
