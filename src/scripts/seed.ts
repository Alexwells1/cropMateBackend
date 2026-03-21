/**
 * CropMate — Full Database Seed Script
 * Run: npm run seed
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';

// Models
import { UserModel } from '../modules/auth/repository/user.model';
import { FarmModel } from '../modules/farm/repository/farm.model';
import { CropModel } from '../modules/crop/repository/crop.model';
import { CropRecordModel } from '../modules/cropRecord/repository/cropRecord.model';
import { SoilDataModel } from '../modules/soil/repository/soilData.model';
import { RotationHistoryModel } from '../modules/rotation/repository/rotationHistory.model';

async function seed(): Promise<void> {
  console.log('\n🌱  CropMate Database Seeder');
  console.log('================================\n');

  await mongoose.connect(config.database.mongoUri);
  console.log('✅  Connected to MongoDB\n');

  // Drop existing seed data
  await Promise.all([
    UserModel.deleteMany({}),
    FarmModel.deleteMany({}),
    CropModel.deleteMany({}),
    CropRecordModel.deleteMany({}),
    SoilDataModel.deleteMany({}),
    RotationHistoryModel.deleteMany({}),
  ]);
  console.log('🧹  Cleared existing data\n');

  // ── Users ──────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const [musa, amina, emeka] = await UserModel.insertMany([
    { name: 'Flourish Girl', phone: '+2349158443073', passwordHash },
    { name: 'Mikun Chukwu', phone: '+2349161285212', passwordHash },
    { name: 'Chukwu Emeka', phone: '+2348055551234', passwordHash },
  ]);
  console.log(`✅  Created 3 farmer accounts`);

  // ── Farms ──────────────────────────────────────────────────────
  const [musaFarm1, musaFarm2, aminaFarm, emekaFarm] = await FarmModel.insertMany([
    {
      userId: musa!._id,
      farmName: 'Musa Main Farm',
      farmSize: 5.0,
      location: { latitude: 6.5244, longitude: 3.3792 },
      soilType: 'Loamy',
    },
    {
      userId: musa!._id,
      farmName: 'Musa North Plot',
      farmSize: 2.0,
      location: { latitude: 6.528, longitude: 3.381 },
      soilType: 'Sandy',
    },
    {
      userId: amina!._id,
      farmName: "Amina's Garden",
      farmSize: 3.0,
      location: { latitude: 6.530, longitude: 3.385 },
      soilType: 'Loamy',
    },
    {
      userId: emeka!._id,
      farmName: 'Emeka East Farm',
      farmSize: 8.0,
      location: { latitude: 6.515, longitude: 3.370 },
      soilType: 'Clay',
    },
  ]);
  console.log(`✅  Created 4 farms`);

  // ── Crops ──────────────────────────────────────────────────────
  const [maize, tomato, beans, cassava] = await CropModel.insertMany([
    {
      farmId: musaFarm1!._id,
      cropName: 'Maize',
      plantingDate: new Date('2026-01-15'),
      fieldArea: 3.0,
      status: 'growing',
      expectedHarvestDate: new Date('2026-04-30'),
    },
    {
      farmId: musaFarm1!._id,
      cropName: 'Tomato',
      plantingDate: new Date('2026-02-01'),
      fieldArea: 2.0,
      status: 'growing',
      expectedHarvestDate: new Date('2026-04-15'),
    },
    {
      farmId: aminaFarm!._id,
      cropName: 'Beans',
      plantingDate: new Date('2025-11-10'),
      fieldArea: 2.5,
      status: 'harvested',
      expectedHarvestDate: new Date('2026-01-20'),
    },
    {
      farmId: emekaFarm!._id,
      cropName: 'Cassava',
      plantingDate: new Date('2025-09-01'),
      fieldArea: 6.0,
      status: 'growing',
      expectedHarvestDate: new Date('2026-09-01'),
    },
    {
      farmId: musaFarm2!._id,
      cropName: 'Pepper',
      plantingDate: new Date('2026-02-10'),
      fieldArea: 2.0,
      status: 'growing',
      expectedHarvestDate: new Date('2026-05-10'),
    },
  ]);
  console.log(`✅  Created 5 crops`);

  // ── Crop Records ───────────────────────────────────────────────
  await CropRecordModel.insertMany([
    {
      cropId: maize!._id,
      activityType: 'planting',
      description: 'Planted WEMA maize seed at 75cm x 25cm spacing',
      quantity: '3 kg seed',
      activityDate: new Date('2026-01-15'),
    },
    {
      cropId: maize!._id,
      activityType: 'fertilizer',
      description: 'Applied NPK 15-15-15 basal fertilizer',
      quantity: '2 bags (50kg each)',
      activityDate: new Date('2026-01-20'),
    },
    {
      cropId: maize!._id,
      activityType: 'irrigation',
      description: 'Drip irrigation — supplemental watering',
      quantity: '20mm',
      activityDate: new Date('2026-02-05'),
    },
    {
      cropId: tomato!._id,
      activityType: 'planting',
      description: 'Transplanted Roma tomato seedlings from nursery',
      quantity: '800 seedlings',
      activityDate: new Date('2026-02-01'),
    },
    {
      cropId: tomato!._id,
      activityType: 'pesticide',
      description: 'Applied Neem extract (3% solution) against aphids',
      quantity: '10 litres',
      activityDate: new Date('2026-02-20'),
    },
    {
      cropId: beans!._id,
      activityType: 'harvest',
      description: 'Harvested dry beans — good yield achieved',
      quantity: '18 bags (90kg each) = 1,620kg',
      activityDate: new Date('2026-01-20'),
    },
    {
      cropId: cassava!._id,
      activityType: 'weeding',
      description: 'Manual weeding between cassava rows',
      quantity: 'Full 6ha',
      activityDate: new Date('2026-01-10'),
    },
  ]);
  console.log(`✅  Created 7 crop activity records`);

  // ── Soil Data ──────────────────────────────────────────────────
  await SoilDataModel.insertMany([
    {
      farmId: musaFarm1!._id,
      ph: 6.4,
      nitrogen: 0.28,
      phosphorus: 0.16,
      potassium: 0.42,
      organicCarbon: 0.87,
      moistureLevel: 36,
      source: 'iSDA Africa Soil API',
      recordedAt: new Date(),
    },
    {
      farmId: emekaFarm!._id,
      ph: 5.8,
      nitrogen: 0.19,
      phosphorus: 0.11,
      potassium: 0.35,
      organicCarbon: 0.62,
      moistureLevel: 42,
      source: 'iSDA Africa Soil API',
      recordedAt: new Date(),
    },
  ]);
  console.log(`✅  Created 2 soil data records`);

  // ── Rotation History ───────────────────────────────────────────
  await RotationHistoryModel.insertMany([
    {
      farmId: aminaFarm!._id,
      cropId: beans!._id,
      previousCrop: 'Beans',
      seasonYear: 2025,
      recommendedNextCrop: 'Maize',
      reason: 'Maize benefits from the residual nitrogen fixed by beans in the previous season.',
    },
  ]);
  console.log(`✅  Created 1 rotation history record`);

  console.log('\n🎉  Seeding complete!\n');
  console.log('📋  Test Login Credentials (all passwords: "password123")');
  console.log('   ┌──────────────────┬─────────────────────┐');
  console.log('   │ Name             │ Phone               │');
  console.log('   ├──────────────────┼─────────────────────┤');
  console.log('   │ Musa Ibrahim     │ +2348012345678      │');
  console.log('   │ Amina Yusuf      │ +2348098765432      │');
  console.log('   │ Chukwu Emeka     │ +2348055551234      │');
  console.log('   └──────────────────┴─────────────────────┘\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seeding failed:', err);
  process.exit(1);
});
