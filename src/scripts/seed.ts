/**
 * CropMate — Simplified Seed Script
 * Run: npm run seed
 *
 * Crops are assigned automatically from a central definition table.
 * Each crop entry carries its own sample records — no manual per-user lists.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';

import { UserModel }            from '../modules/auth/repository/user.model';
import { FarmModel }            from '../modules/farm/repository/farm.model';
import { CropModel }            from '../modules/crop/repository/crop.model';
import { CropRecordModel }      from '../modules/cropRecord/repository/cropRecord.model';
import { SoilDataModel }        from '../modules/soil/repository/soilData.model';
import { RotationHistoryModel } from '../modules/rotation/repository/rotationHistory.model';

// ─── helpers ────────────────────────────────────────────────────────────────

const daysFromNow = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt; };
const daysAgo     = (d: number) => daysFromNow(-d);
const pick        = <T>(arr: T[], n: number): T[] => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

// ─── crop catalogue ──────────────────────────────────────────────────────────
// Each entry defines timing, area, status, and sample activity records.
// The loop assigns these automatically to every user — no manual listing needed.

type RecordTemplate = {
  activityType: 'fertilizer'|'irrigation'|'pesticide'|'harvest'|'planting'|'weeding'|'other';
  description:  string;
  quantity:     string;
  daysAgoOffset: number;
};

type CropTemplate = {
  cropName:           string;
  plantingDaysAgo:    number;
  harvestDaysFromNow: number;
  fieldArea:          number;
  status:             'growing'|'harvested'|'failed'|'dormant';
  records:            RecordTemplate[];
};

const CROP_CATALOGUE: CropTemplate[] = [
  {
    cropName: 'Tomato', plantingDaysAgo: 60, harvestDaysFromNow: 30, fieldArea: 0.5, status: 'growing',
    records: [
      { activityType: 'planting',  description: 'Transplanted Roma tomato seedlings at 50cm × 40cm spacing.',      quantity: '900 seedlings', daysAgoOffset: 60 },
      { activityType: 'pesticide', description: 'Applied Neem extract (3% solution) against aphids and whitefly.', quantity: '15 litres',     daysAgoOffset: 30 },
    ],
  },
  {
    cropName: 'Pepper', plantingDaysAgo: 55, harvestDaysFromNow: 35, fieldArea: 0.4, status: 'growing',
    records: [
      { activityType: 'planting',   description: 'Transplanted hot pepper seedlings with drip irrigation lines.', quantity: '600 seedlings', daysAgoOffset: 55 },
      { activityType: 'irrigation', description: 'Drip irrigation — 2 L/plant/day for consistent soil moisture.', quantity: '1,200 L',       daysAgoOffset: 25 },
    ],
  },
  {
    cropName: 'Corn', plantingDaysAgo: 70, harvestDaysFromNow: 20, fieldArea: 0.6, status: 'growing',
    records: [
      { activityType: 'planting',   description: 'Planted WEMA maize seed at 75cm × 25cm spacing on ridged beds.', quantity: '3 kg seed',           daysAgoOffset: 70 },
      { activityType: 'fertilizer', description: 'Applied NPK 15-15-15 basal fertilizer at planting stage.',        quantity: '2 bags (50 kg each)', daysAgoOffset: 65 },
      { activityType: 'weeding',    description: 'Manual inter-row weeding during vegetative stage.',               quantity: 'Full plot',           daysAgoOffset: 45 },
    ],
  },
  {
    cropName: 'Potato', plantingDaysAgo: 80, harvestDaysFromNow: 10, fieldArea: 0.5, status: 'growing',
    records: [
      { activityType: 'planting',  description: 'Planted certified potato seed pieces on earthed-up ridged beds.', quantity: '120 kg seed pieces', daysAgoOffset: 80 },
      { activityType: 'pesticide', description: 'Copper-based fungicide spray — preventive against late blight.',   quantity: '8 litres',           daysAgoOffset: 40 },
    ],
  },
  {
    cropName: 'Soybean', plantingDaysAgo: 90, harvestDaysFromNow: 15, fieldArea: 0.7, status: 'growing',
    records: [
      { activityType: 'planting', description: 'Planted TGX1448-2E soybean, seeds inoculated with Bradyrhizobium.', quantity: '18 kg seed', daysAgoOffset: 90 },
      { activityType: 'weeding',  description: 'Hoe weeding between soybean rows at 3 weeks after planting.',        quantity: 'Full plot', daysAgoOffset: 67 },
    ],
  },
  {
    cropName: 'Strawberry', plantingDaysAgo: 50, harvestDaysFromNow: 40, fieldArea: 0.4, status: 'growing',
    records: [
      { activityType: 'planting',   description: 'Transplanted strawberry runners onto raised beds with black mulch.', quantity: '400 runners', daysAgoOffset: 50 },
      { activityType: 'fertilizer', description: 'Applied balanced 10-10-10 granular fertilizer as base dressing.',    quantity: '5 kg',        daysAgoOffset: 45 },
    ],
  },
  {
    cropName: 'Apple', plantingDaysAgo: 120, harvestDaysFromNow: 60, fieldArea: 0.8, status: 'growing',
    records: [
      { activityType: 'planting', description: 'Planted grafted Anna apple trees for low-chill tropical conditions.', quantity: '30 trees', daysAgoOffset: 120 },
      { activityType: 'other',    description: 'Formative pruning to establish open-centre canopy structure.',         quantity: '30 trees', daysAgoOffset:  60 },
    ],
  },
  {
    cropName: 'Grape', plantingDaysAgo: 100, harvestDaysFromNow: 50, fieldArea: 0.6, status: 'growing',
    records: [
      { activityType: 'planting', description: 'Established grape vines on overhead trellis at 2m × 3m spacing.',    quantity: '60 vines', daysAgoOffset: 100 },
      { activityType: 'other',    description: 'Cane pruning — 2 canes × 8 buds per vine to promote fruiting wood.', quantity: '60 vines', daysAgoOffset:  55 },
    ],
  },
  {
    cropName: 'Peach', plantingDaysAgo: 110, harvestDaysFromNow: 55, fieldArea: 0.5, status: 'growing',
    records: [
      { activityType: 'planting', description: 'Planted low-chill Florida Prince peach, staked for wind support.', quantity: '20 trees', daysAgoOffset: 110 },
    ],
  },
  {
    cropName: 'Cherry', plantingDaysAgo: 95, harvestDaysFromNow: 45, fieldArea: 0.5, status: 'growing',
    records: [
      { activityType: 'planting', description: 'Planted dwarf cherry trees in containers for tropical adaptation.', quantity: '15 trees', daysAgoOffset: 95 },
    ],
  },
  {
    cropName: 'Squash', plantingDaysAgo: 45, harvestDaysFromNow: 45, fieldArea: 0.4, status: 'growing',
    records: [
      { activityType: 'planting',   description: 'Direct-seeded butternut squash on mounds at 1.5m × 1m spacing.', quantity: '2 kg seed', daysAgoOffset: 45 },
      { activityType: 'irrigation', description: 'Overhead irrigation during fruit set to maintain moisture.',      quantity: '20 mm',    daysAgoOffset: 20 },
    ],
  },
  {
    cropName: 'Blueberry', plantingDaysAgo: 85, harvestDaysFromNow: 30, fieldArea: 0.3, status: 'growing',
    records: [
      { activityType: 'planting',   description: 'Planted rabbiteye blueberry in acidified peat mix, pH 4.5.',  quantity: '25 plants', daysAgoOffset: 85 },
      { activityType: 'fertilizer', description: 'Ammonium sulphate side-dressing to maintain low soil pH.',     quantity: '5 kg',      daysAgoOffset: 50 },
    ],
  },
  {
    cropName: 'Raspberry', plantingDaysAgo: 70, harvestDaysFromNow: 35, fieldArea: 0.3, status: 'growing',
    records: [
      { activityType: 'planting',   description: 'Planted Heritage raspberry canes in raised beds with compost.', quantity: '80 canes',  daysAgoOffset: 70 },
      { activityType: 'irrigation', description: 'Drip irrigation set to 1.5 L/plant/day for raspberry canes.', quantity: '120 L/day', daysAgoOffset: 65 },
    ],
  },
  {
    cropName: 'Orange', plantingDaysAgo: 150, harvestDaysFromNow: 90, fieldArea: 0.8, status: 'growing',
    records: [
      { activityType: 'planting',   description: 'Established Valencia orange orchard on Trifoliate rootstock.',   quantity: '40 trees',           daysAgoOffset: 150 },
      { activityType: 'fertilizer', description: 'Applied citrus NPK 13-7-13 + micro-nutrients as broadcast.',     quantity: '4 bags (25 kg each)', daysAgoOffset:  80 },
    ],
  },
];

// ─── user + farm definitions ─────────────────────────────────────────────────

const USER_DEFS = [
  { name: 'Flourish Tiānshǐ', phone: '+2349158443073' },
  { name: 'Mikun Qíngrén',    phone: '+2349161285212' },
  { name: 'Chukwu Emeka',     phone: '+2348055551234' },
  { name: 'Unknown Olu',      phone: '+2347068109462' },
  { name: 'Dara Adebayo',     phone: '+2347038929287' },
  { name: 'Wheto Emenike',    phone: '+2348083377645' },
];

const SOIL_TYPES = ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky'] as const;

function farmDefsFor(userId: mongoose.Types.ObjectId, idx: number) {
  const lat       = 6.52 + idx * 0.01;
  const lng       = 3.38 + idx * 0.005;
  const firstName = USER_DEFS[idx]!.name.split(' ')[0];
  // Each farm gets a unique clientId string so the sparse unique index
  // (userId, clientId) never sees two null values for the same user.
  return [
    { userId, clientId: `seed-farm-${idx}-1`, farmName: `${firstName} Farm 1`, farmSize: +(3   + idx * 0.5).toFixed(1), location: { latitude: lat,         longitude: lng         }, soilType: SOIL_TYPES[idx % SOIL_TYPES.length]       },
    { userId, clientId: `seed-farm-${idx}-2`, farmName: `${firstName} Farm 2`, farmSize: +(3.5 + idx * 0.4).toFixed(1), location: { latitude: lat + 0.005, longitude: lng + 0.003 }, soilType: SOIL_TYPES[(idx + 1) % SOIL_TYPES.length] },
  ];
}

// ─── seed ───────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log('\n🌱  CropMate Database Seeder');
  console.log('================================\n');

  await mongoose.connect(config.database.mongoUri);
  console.log('✅  Connected to MongoDB\n');

  await Promise.all([
    UserModel.deleteMany({}),
    FarmModel.deleteMany({}),
    CropModel.deleteMany({}),
    CropRecordModel.deleteMany({}),
    SoilDataModel.deleteMany({}),
    RotationHistoryModel.deleteMany({}),
  ]);
  console.log('🧹  Cleared existing data\n');

  // ── Users ────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);
  const users = await UserModel.insertMany(
    USER_DEFS.map(u => ({ ...u, passwordHash }))
  );
  console.log(`✅  Created ${users.length} farmer accounts`);

  // ── Farms ─────────────────────────────────────────────────────────────────
  const farmDefs = users.flatMap((u, i) => farmDefsFor(u._id, i));
  const farms    = await FarmModel.insertMany(farmDefs);
  console.log(`✅  Created ${farms.length} farms (2 per user)`);

  // ── Crops + Records ───────────────────────────────────────────────────────
  // Pick 10–12 crop types per user and spread them across their 2 farms.
  // Insert per-farm (not one big bulk write) to avoid the sparse unique index
  // on (farmId, clientId) treating multiple null clientId values as duplicates
  // within a single insertMany call targeting the same farmId.

  const MIN_CROPS = 10;
  let totalCrops = 0, totalRecords = 0;

  for (let ui = 0; ui < users.length; ui++) {
    const userFarms   = farms.slice(ui * 2, ui * 2 + 2) as typeof farms;
    const chosen      = pick(CROP_CATALOGUE, MIN_CROPS + Math.floor(Math.random() * 3)); // 10–12
    const half        = Math.ceil(chosen.length / 2);
    const assignments = chosen.map((tmpl, i) => ({ tmpl, farm: userFarms[i < half ? 0 : 1]! }));

    // Collect inserted crop docs across both farms, preserving assignment order
    // so that cropDocs[i] always corresponds to assignments[i].
    const cropDocs: any[] = [];
    for (const farm of userFarms) {
      const batch = assignments
        .map((a, origIdx) => ({ a, origIdx }))
        .filter(({ a }) => String(a.farm._id) === String(farm._id));

      const inserted = await CropModel.insertMany(
        batch.map(({ a: { tmpl } }) => ({
          farmId:              farm._id,
          cropName:            tmpl.cropName,
          plantingDate:        daysAgo(tmpl.plantingDaysAgo),
          fieldArea:           tmpl.fieldArea,
          status:              tmpl.status,
          expectedHarvestDate: daysFromNow(tmpl.harvestDaysFromNow),
        }))
      );

      // Place inserted docs back at their original assignment index
      batch.forEach(({ origIdx }, batchPos) => {
        cropDocs[origIdx] = inserted[batchPos];
      });
    }
    totalCrops += cropDocs.length;

    const recordDocs = assignments.flatMap(({ tmpl }, i) =>
      tmpl.records.map(r => ({
        cropId:       cropDocs[i]!._id,
        activityType: r.activityType,
        description:  r.description,
        quantity:     r.quantity,
        activityDate: daysAgo(r.daysAgoOffset),
      }))
    );
    await CropRecordModel.insertMany(recordDocs);
    totalRecords += recordDocs.length;

    const pct = Math.round((chosen.length / CROP_CATALOGUE.length) * 100);
    console.log(`   ✅  ${users[ui]!.name}: ${chosen.length}/${CROP_CATALOGUE.length} crop types (${pct}%)`);
  }
  console.log(`✅  Created ${totalCrops} crops and ${totalRecords} activity records`);

  // ── Soil Data ─────────────────────────────────────────────────────────────
  await SoilDataModel.insertMany(
    farms.map((farm, i) => ({
      farmId:        farm._id,
      ph:            +(5.8 + (i % 5) * 0.2).toFixed(1),
      nitrogen:      +(0.19 + (i % 6) * 0.02).toFixed(2),
      phosphorus:    +(0.11 + (i % 5) * 0.015).toFixed(3),
      potassium:     +(0.35 + (i % 6) * 0.015).toFixed(3),
      organicCarbon: +(0.62 + (i % 6) * 0.06).toFixed(2),
      moistureLevel: 30 + (i % 5) * 3,
      source:        'iSDA Africa Soil API',
      recordedAt:    new Date(),
    }))
  );
  console.log(`✅  Created ${farms.length} soil data records (1 per farm)`);

  // ── Rotation History ──────────────────────────────────────────────────────
  // Resolved dynamically against whatever crops were actually inserted.
  const ROTATIONS = [
    { prev: 'Soybean', next: 'Corn',    reason: 'Corn benefits from residual nitrogen fixed by soybean in the prior season.' },
    { prev: 'Corn',    next: 'Soybean', reason: 'Soybean restores soil nitrogen depleted by corn and breaks rootworm cycles.' },
    { prev: 'Potato',  next: 'Corn',    reason: 'Corn breaks solanaceous disease cycles and uses residual soil potassium.'    },
    { prev: 'Squash',  next: 'Tomato',  reason: 'Tomato after squash improves land-use efficiency; allow 3-year cucurbit break.' },
  ];

  const allCrops = await CropModel.find({});
  const rotationDocs = [];
  for (const rot of ROTATIONS) {
    const match = allCrops.find(c => c.cropName === rot.prev);
    if (!match) continue;
    const farm = farms.find(f => String(f._id) === String(match.farmId));
    if (!farm) continue;
    rotationDocs.push({
      farmId:              farm._id,
      cropId:              match._id,
      previousCrop:        rot.prev,
      seasonYear:          2025,
      recommendedNextCrop: rot.next,
      reason:              rot.reason,
    });
  }
  await RotationHistoryModel.insertMany(rotationDocs);
  console.log(`✅  Created ${rotationDocs.length} rotation history records`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉  Seeding complete!\n');
  console.log('📋  Test Login Credentials (all passwords: "password123")');
  console.log('   ┌──────────────────────┬─────────────────────┐');
  console.log('   │ Name                 │ Phone               │');
  console.log('   ├──────────────────────┼─────────────────────┤');
  USER_DEFS.forEach(u => console.log(`   │ ${u.name.padEnd(20)} │ ${u.phone.padEnd(19)} │`));
  console.log('   └──────────────────────┴─────────────────────┘\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌  Seeding failed:', err);
  process.exit(1);
});