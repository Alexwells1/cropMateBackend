/**
 * CropMate — Full Database Seed Script (Schema-aligned)
 * Run: npm run seed
 *
 * Allowed crop names (trained model — 14 unique types):
 *   Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach,
 *   Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato
 *
 * Schema constraints respected:
 *   Farm.soilType  → 'Loamy' | 'Sandy' | 'Clay' | 'Silty' | 'Peaty' | 'Chalky' | 'Unknown'
 *   Crop.status    → 'growing' | 'harvested' | 'failed' | 'dormant'
 *   CropRecord.activityType → 'fertilizer' | 'irrigation' | 'pesticide' |
 *                             'harvest' | 'planting' | 'weeding' | 'other'
 *   CropRecord.quantity     → maxlength 100
 *   CropRecord.description  → maxlength 500
 *
 * Rules enforced:
 *   ✅  Every user has ≥ 2 farms
 *   ✅  Every user covers ≥ 60 % of the 14 crop types (≥ 9 crops per user)
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

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
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

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const [Flourish, Mikun, emeka] = await UserModel.insertMany([
    { name: 'Flourish Tiānshǐ', phone: '+2349158443073', passwordHash },
    { name: 'Mikun Qíngrén',    phone: '+2349161285212', passwordHash },
    { name: 'Chukwu Emeka',     phone: '+2348055551234', passwordHash },
  ]);
  console.log('✅  Created 3 farmer accounts');

  // ── Farms ─────────────────────────────────────────────────────────────────
  // soilType must be one of: Loamy | Sandy | Clay | Silty | Peaty | Chalky | Unknown
  const [
    FlourishFarm1, FlourishFarm2,
    MikunFarm1, MikunFarm2,
    emekaFarm1, emekaFarm2,
  ] = await FarmModel.insertMany([
    // Flourish — 2 farms
    { userId: Flourish!._id,  farmName: 'Flourish Main Farm',     farmSize: 5.0, location: { latitude: 6.5244, longitude: 3.3792 }, soilType: 'Loamy' },
    { userId: Flourish!._id,  farmName: 'Flourish North Plot',    farmSize: 4.5, location: { latitude: 6.5280, longitude: 3.3810 }, soilType: 'Sandy' },
    // Mikun — 2 farms
    { userId: Mikun!._id, farmName: "Mikun's Garden",     farmSize: 3.0, location: { latitude: 6.5300, longitude: 3.3850 }, soilType: 'Loamy' },
    { userId: Mikun!._id, farmName: "Mikun's South Plot", farmSize: 4.0, location: { latitude: 6.5220, longitude: 3.3800 }, soilType: 'Silty' },
    // Emeka — 2 farms
    { userId: emeka!._id, farmName: 'Emeka East Farm',    farmSize: 8.0, location: { latitude: 6.5150, longitude: 3.3700 }, soilType: 'Clay'  },
    { userId: emeka!._id, farmName: 'Emeka West Plot',    farmSize: 6.0, location: { latitude: 6.5100, longitude: 3.3620 }, soilType: 'Loamy' },
  ]);
  console.log('✅  Created 6 farms (2 per user)');

  // ── Crops ─────────────────────────────────────────────────────────────────
  //
  // Flourish  — 12 / 14 types (86%): Apple Blueberry Cherry Corn Grape Peach
  //                               Pepper Potato Soybean Squash Strawberry Tomato
  // Mikun — 11 / 14 types (79%): Apple Cherry Corn Grape Peach Pepper Potato
  //                               Raspberry Soybean Strawberry Tomato
  // EMEKA — 12 / 14 types (86%): Apple Blueberry Corn Grape Orange Peach
  //                               Pepper Potato Soybean Squash Strawberry Tomato

  // ── Flourish ──────────────────────────────────────────────────────────────────
  const FlourishCrops = await CropModel.insertMany([
    // Farm 1
    { farmId: FlourishFarm1!._id, cropName: 'Tomato',     plantingDate: daysAgo(60),  fieldArea: 0.5, status: 'growing',   expectedHarvestDate: daysFromNow(30) },
    { farmId: FlourishFarm1!._id, cropName: 'Pepper',     plantingDate: daysAgo(55),  fieldArea: 0.4, status: 'growing',   expectedHarvestDate: daysFromNow(35) },
    { farmId: FlourishFarm1!._id, cropName: 'Corn',       plantingDate: daysAgo(70),  fieldArea: 0.6, status: 'growing',   expectedHarvestDate: daysFromNow(20) },
    { farmId: FlourishFarm1!._id, cropName: 'Potato',     plantingDate: daysAgo(80),  fieldArea: 0.5, status: 'growing',   expectedHarvestDate: daysFromNow(10) },
    { farmId: FlourishFarm1!._id, cropName: 'Soybean',    plantingDate: daysAgo(90),  fieldArea: 0.7, status: 'growing',   expectedHarvestDate: daysFromNow(15) },
    { farmId: FlourishFarm1!._id, cropName: 'Strawberry', plantingDate: daysAgo(50),  fieldArea: 0.4, status: 'growing',   expectedHarvestDate: daysFromNow(40) },
    { farmId: FlourishFarm1!._id, cropName: 'Apple',      plantingDate: daysAgo(120), fieldArea: 0.8, status: 'growing',   expectedHarvestDate: daysFromNow(60) },
    // Farm 2
    { farmId: FlourishFarm2!._id, cropName: 'Grape',      plantingDate: daysAgo(100), fieldArea: 0.6, status: 'growing',   expectedHarvestDate: daysFromNow(50) },
    { farmId: FlourishFarm2!._id, cropName: 'Peach',      plantingDate: daysAgo(110), fieldArea: 0.5, status: 'growing',   expectedHarvestDate: daysFromNow(55) },
    { farmId: FlourishFarm2!._id, cropName: 'Cherry',     plantingDate: daysAgo(95),  fieldArea: 0.5, status: 'growing',   expectedHarvestDate: daysFromNow(45) },
    { farmId: FlourishFarm2!._id, cropName: 'Squash',     plantingDate: daysAgo(45),  fieldArea: 0.4, status: 'growing',   expectedHarvestDate: daysFromNow(45) },
    { farmId: FlourishFarm2!._id, cropName: 'Blueberry',  plantingDate: daysAgo(85),  fieldArea: 0.3, status: 'growing',   expectedHarvestDate: daysFromNow(30) },
  ]);
  const [
    FlourishTomato, FlourishPepper, FlourishCorn, FlourishPotato, FlourishSoybean,
    FlourishStrawberry, FlourishApple, FlourishGrape, FlourishPeach, FlourishCherry,
    FlourishSquash, FlourishBlueberry,
  ] = FlourishCrops;
  console.log(`✅  Created ${FlourishCrops.length} crops for Flourish  (12/14 types — 86%)`);

  // ── Mikun ─────────────────────────────────────────────────────────────────
  const MikunCrops = await CropModel.insertMany([
    // Farm 1
    { farmId: MikunFarm1!._id, cropName: 'Tomato',     plantingDate: daysAgo(55),  fieldArea: 0.5, status: 'growing',   expectedHarvestDate: daysFromNow(35) },
    { farmId: MikunFarm1!._id, cropName: 'Pepper',     plantingDate: daysAgo(50),  fieldArea: 0.4, status: 'growing',   expectedHarvestDate: daysFromNow(40) },
    { farmId: MikunFarm1!._id, cropName: 'Strawberry', plantingDate: daysAgo(60),  fieldArea: 0.3, status: 'growing',   expectedHarvestDate: daysFromNow(30) },
    { farmId: MikunFarm1!._id, cropName: 'Cherry',     plantingDate: daysAgo(90),  fieldArea: 0.5, status: 'growing',   expectedHarvestDate: daysFromNow(50) },
    { farmId: MikunFarm1!._id, cropName: 'Apple',      plantingDate: daysAgo(130), fieldArea: 0.7, status: 'growing',   expectedHarvestDate: daysFromNow(65) },
    { farmId: MikunFarm1!._id, cropName: 'Corn',       plantingDate: daysAgo(65),  fieldArea: 0.5, status: 'growing',   expectedHarvestDate: daysFromNow(25) },
    // Farm 2
    { farmId: MikunFarm2!._id, cropName: 'Grape',      plantingDate: daysAgo(105), fieldArea: 0.6, status: 'growing',   expectedHarvestDate: daysFromNow(55) },
    { farmId: MikunFarm2!._id, cropName: 'Peach',      plantingDate: daysAgo(100), fieldArea: 0.5, status: 'growing',   expectedHarvestDate: daysFromNow(60) },
    { farmId: MikunFarm2!._id, cropName: 'Potato',     plantingDate: daysAgo(75),  fieldArea: 0.4, status: 'harvested', expectedHarvestDate: daysAgo(5)       },
    { farmId: MikunFarm2!._id, cropName: 'Soybean',    plantingDate: daysAgo(85),  fieldArea: 0.6, status: 'growing',   expectedHarvestDate: daysFromNow(20) },
    { farmId: MikunFarm2!._id, cropName: 'Raspberry',  plantingDate: daysAgo(70),  fieldArea: 0.3, status: 'growing',   expectedHarvestDate: daysFromNow(35) },
  ]);
  const [
    MikunTomato, MikunPepper, MikunStrawberry, MikunCherry, MikunApple,
    MikunCorn, MikunGrape, MikunPeach, MikunPotato, MikunSoybean,
    MikunRaspberry,
  ] = MikunCrops;
  console.log(`✅  Created ${MikunCrops.length} crops for Mikun (11/14 types — 79%)`);

  // ── EMEKA ─────────────────────────────────────────────────────────────────
  const emekaCrops = await CropModel.insertMany([
    // Farm 1
    { farmId: emekaFarm1!._id, cropName: 'Tomato',     plantingDate: daysAgo(58),  fieldArea: 1.0, status: 'growing',   expectedHarvestDate: daysFromNow(32) },
    { farmId: emekaFarm1!._id, cropName: 'Pepper',     plantingDate: daysAgo(52),  fieldArea: 0.8, status: 'growing',   expectedHarvestDate: daysFromNow(38) },
    { farmId: emekaFarm1!._id, cropName: 'Corn',       plantingDate: daysAgo(72),  fieldArea: 1.2, status: 'growing',   expectedHarvestDate: daysFromNow(18) },
    { farmId: emekaFarm1!._id, cropName: 'Soybean',    plantingDate: daysAgo(92),  fieldArea: 1.0, status: 'growing',   expectedHarvestDate: daysFromNow(12) },
    { farmId: emekaFarm1!._id, cropName: 'Squash',     plantingDate: daysAgo(48),  fieldArea: 0.6, status: 'growing',   expectedHarvestDate: daysFromNow(42) },
    { farmId: emekaFarm1!._id, cropName: 'Potato',     plantingDate: daysAgo(82),  fieldArea: 0.9, status: 'growing',   expectedHarvestDate: daysFromNow(8)  },
    { farmId: emekaFarm1!._id, cropName: 'Orange',     plantingDate: daysAgo(150), fieldArea: 0.8, status: 'growing',   expectedHarvestDate: daysFromNow(90) },
    // Farm 2
    { farmId: emekaFarm2!._id, cropName: 'Apple',      plantingDate: daysAgo(140), fieldArea: 0.9, status: 'growing',   expectedHarvestDate: daysFromNow(70) },
    { farmId: emekaFarm2!._id, cropName: 'Grape',      plantingDate: daysAgo(110), fieldArea: 0.7, status: 'growing',   expectedHarvestDate: daysFromNow(60) },
    { farmId: emekaFarm2!._id, cropName: 'Peach',      plantingDate: daysAgo(105), fieldArea: 0.6, status: 'growing',   expectedHarvestDate: daysFromNow(55) },
    { farmId: emekaFarm2!._id, cropName: 'Strawberry', plantingDate: daysAgo(55),  fieldArea: 0.4, status: 'growing',   expectedHarvestDate: daysFromNow(35) },
    { farmId: emekaFarm2!._id, cropName: 'Blueberry',  plantingDate: daysAgo(80),  fieldArea: 0.4, status: 'growing',   expectedHarvestDate: daysFromNow(28) },
  ]);
  const [
    emekaTomato, emekaPepper, emekaCorn, emekaSoybean, emekaSquash,
    emekaPotato, emekaOrange, emekaApple, emekaGrape, emekaPeach,
    emekaStrawberry, emekaBlueberry,
  ] = emekaCrops;
  console.log(`✅  Created ${emekaCrops.length} crops for Emeka (12/14 types — 86%)`);

  // ── Crop Records ──────────────────────────────────────────────────────────
  // activityType must be one of:
  //   fertilizer | irrigation | pesticide | harvest | planting | weeding | other
  // quantity maxlength: 100  |  description maxlength: 500
  // NOTE: 'fungicide' → 'pesticide', 'pruning' → 'other'

  await CropRecordModel.insertMany([

    // ── Flourish ─────────────────────────────────────────────────────────────────
    {
      cropId: FlourishTomato!._id,
      activityType: 'planting',
      description: 'Transplanted Roma tomato seedlings from nursery at 50cm × 40cm spacing.',
      quantity: '900 seedlings',
      activityDate: daysAgo(60),
    },
    {
      cropId: FlourishTomato!._id,
      activityType: 'pesticide',
      description: 'Applied Neem extract (3% solution) against aphids and whitefly.',
      quantity: '15 litres',
      activityDate: daysAgo(30),
    },
    {
      cropId: FlourishPepper!._id,
      activityType: 'planting',
      description: 'Transplanted hot pepper seedlings with drip irrigation lines installed.',
      quantity: '600 seedlings',
      activityDate: daysAgo(55),
    },
    {
      cropId: FlourishPepper!._id,
      activityType: 'irrigation',
      description: 'Drip irrigation run — 2 L/plant/day to maintain consistent soil moisture.',
      quantity: '1,200 L',
      activityDate: daysAgo(25),
    },
    {
      cropId: FlourishCorn!._id,
      activityType: 'planting',
      description: 'Planted WEMA maize seed at 75cm × 25cm spacing on ridged beds.',
      quantity: '3 kg seed',
      activityDate: daysAgo(70),
    },
    {
      cropId: FlourishCorn!._id,
      activityType: 'fertilizer',
      description: 'Applied NPK 15-15-15 basal fertilizer at planting stage.',
      quantity: '2 bags (50 kg each)',
      activityDate: daysAgo(65),
    },
    {
      cropId: FlourishCorn!._id,
      activityType: 'weeding',
      description: 'Manual inter-row weeding to reduce weed competition during vegetative stage.',
      quantity: 'Full 0.6 ha',
      activityDate: daysAgo(45),
    },
    {
      cropId: FlourishPotato!._id,
      activityType: 'planting',
      description: 'Planted certified potato seed pieces on earthed-up ridged beds.',
      quantity: '120 kg seed pieces',
      activityDate: daysAgo(80),
    },
    {
      cropId: FlourishPotato!._id,
      activityType: 'pesticide',
      description: 'Applied copper-based fungicide spray as preventive measure against late blight.',
      quantity: '8 litres',
      activityDate: daysAgo(40),
    },
    {
      cropId: FlourishSoybean!._id,
      activityType: 'planting',
      description: 'Planted soybean variety TGX1448-2E, seeds inoculated with Bradyrhizobium.',
      quantity: '18 kg seed',
      activityDate: daysAgo(90),
    },
    {
      cropId: FlourishSoybean!._id,
      activityType: 'weeding',
      description: 'Hoe weeding between soybean rows at 3 weeks after planting.',
      quantity: 'Full 0.7 ha',
      activityDate: daysAgo(67),
    },
    {
      cropId: FlourishStrawberry!._id,
      activityType: 'planting',
      description: 'Transplanted strawberry runners onto raised beds with black plastic mulch.',
      quantity: '400 runners',
      activityDate: daysAgo(50),
    },
    {
      cropId: FlourishStrawberry!._id,
      activityType: 'fertilizer',
      description: 'Applied balanced 10-10-10 granular fertilizer as base dressing.',
      quantity: '5 kg',
      activityDate: daysAgo(45),
    },
    {
      cropId: FlourishApple!._id,
      activityType: 'planting',
      description: 'Planted grafted Anna apple trees adapted to low-chill tropical conditions.',
      quantity: '30 trees',
      activityDate: daysAgo(120),
    },
    {
      cropId: FlourishApple!._id,
      activityType: 'other',
      description: 'Formative pruning to establish open-centre canopy structure on young trees.',
      quantity: '30 trees',
      activityDate: daysAgo(60),
    },
    {
      cropId: FlourishGrape!._id,
      activityType: 'planting',
      description: 'Established grape vines on overhead trellis system at 2m × 3m spacing.',
      quantity: '60 vines',
      activityDate: daysAgo(100),
    },
    {
      cropId: FlourishGrape!._id,
      activityType: 'other',
      description: 'Cane pruning to 2 canes × 8 buds per vine to promote fruiting wood.',
      quantity: '60 vines',
      activityDate: daysAgo(55),
    },
    {
      cropId: FlourishPeach!._id,
      activityType: 'planting',
      description: 'Planted low-chill Florida Prince peach variety, staked for wind support.',
      quantity: '20 trees',
      activityDate: daysAgo(110),
    },
    {
      cropId: FlourishCherry!._id,
      activityType: 'planting',
      description: 'Planted dwarf cherry trees in containers for tropical climate adaptation.',
      quantity: '15 trees',
      activityDate: daysAgo(95),
    },
    {
      cropId: FlourishSquash!._id,
      activityType: 'planting',
      description: 'Direct-seeded butternut squash on mounds at 1.5m × 1m spacing.',
      quantity: '2 kg seed',
      activityDate: daysAgo(45),
    },
    {
      cropId: FlourishSquash!._id,
      activityType: 'irrigation',
      description: 'Overhead irrigation applied during fruit set to maintain moisture.',
      quantity: '20 mm',
      activityDate: daysAgo(20),
    },
    {
      cropId: FlourishBlueberry!._id,
      activityType: 'planting',
      description: 'Planted rabbiteye blueberry in acidified peat mix, soil pH adjusted to 4.5.',
      quantity: '25 plants',
      activityDate: daysAgo(85),
    },
    {
      cropId: FlourishBlueberry!._id,
      activityType: 'fertilizer',
      description: 'Acid fertilizer (ammonium sulphate) side-dressing to maintain low pH.',
      quantity: '5 kg',
      activityDate: daysAgo(50),
    },

    // ── Mikun ─────────────────────────────────────────────────────────────────
    {
      cropId: MikunTomato!._id,
      activityType: 'planting',
      description: 'Transplanted cherry tomato seedlings into trellised rows at 40cm spacing.',
      quantity: '700 seedlings',
      activityDate: daysAgo(55),
    },
    {
      cropId: MikunTomato!._id,
      activityType: 'irrigation',
      description: 'Installed drip irrigation system — 2 L/plant/day watering schedule.',
      quantity: '1,400 L/day',
      activityDate: daysAgo(50),
    },
    {
      cropId: MikunTomato!._id,
      activityType: 'pesticide',
      description: 'Sprayed Mancozeb 80WP against early blight on tomato foliage.',
      quantity: '10 litres',
      activityDate: daysAgo(20),
    },
    {
      cropId: MikunPepper!._id,
      activityType: 'planting',
      description: 'Transplanted sweet bell pepper seedlings at 40cm × 50cm row spacing.',
      quantity: '500 seedlings',
      activityDate: daysAgo(50),
    },
    {
      cropId: MikunPepper!._id,
      activityType: 'fertilizer',
      description: 'Top-dressed with CAN (calcium ammonium nitrate) at 6 weeks after transplanting.',
      quantity: '1 bag (50 kg)',
      activityDate: daysAgo(22),
    },
    {
      cropId: MikunStrawberry!._id,
      activityType: 'planting',
      description: 'Established strawberry bed with drip tape and black plastic mulch cover.',
      quantity: '350 runners',
      activityDate: daysAgo(60),
    },
    {
      cropId: MikunCherry!._id,
      activityType: 'planting',
      description: 'Planted Surinam cherry trees in full-sun location, spaced 3m apart.',
      quantity: '18 trees',
      activityDate: daysAgo(90),
    },
    {
      cropId: MikunApple!._id,
      activityType: 'planting',
      description: 'Planted low-chill Anna apple trees staked with bamboo for wind support.',
      quantity: '25 trees',
      activityDate: daysAgo(130),
    },
    {
      cropId: MikunApple!._id,
      activityType: 'other',
      description: 'Formative pruning to establish open-centre canopy on young apple trees.',
      quantity: '25 trees',
      activityDate: daysAgo(60),
    },
    {
      cropId: MikunCorn!._id,
      activityType: 'planting',
      description: 'Planted sweet corn Jubilee variety in blocks of 4 rows for cross-pollination.',
      quantity: '4 kg seed',
      activityDate: daysAgo(65),
    },
    {
      cropId: MikunCorn!._id,
      activityType: 'weeding',
      description: 'Manual inter-row weeding to reduce weed competition in corn field.',
      quantity: 'Full 0.5 ha',
      activityDate: daysAgo(40),
    },
    {
      cropId: MikunCorn!._id,
      activityType: 'fertilizer',
      description: 'Applied urea top dressing at knee-high stage to boost vegetative growth.',
      quantity: '1 bag (50 kg)',
      activityDate: daysAgo(35),
    },
    {
      cropId: MikunGrape!._id,
      activityType: 'planting',
      description: 'Planted Muscat grape vines on pergola trellis system at 2m × 3m spacing.',
      quantity: '50 vines',
      activityDate: daysAgo(105),
    },
    {
      cropId: MikunPeach!._id,
      activityType: 'planting',
      description: 'Planted Florida Prince peach — low-chill 100-hour tropical adapted variety.',
      quantity: '18 trees',
      activityDate: daysAgo(100),
    },
    {
      cropId: MikunPotato!._id,
      activityType: 'planting',
      description: 'Planted certified potato seed pieces at 30cm spacing on raised ridges.',
      quantity: '100 kg seed pieces',
      activityDate: daysAgo(75),
    },
    {
      cropId: MikunPotato!._id,
      activityType: 'harvest',
      description: 'Harvested potato crop at full maturity — yield stored in cool dry shed.',
      quantity: '850 kg',
      activityDate: daysAgo(5),
    },
    {
      cropId: MikunSoybean!._id,
      activityType: 'planting',
      description: 'Direct-seeded soybean TGX variety in rows 45cm apart, minimal tillage.',
      quantity: '15 kg seed',
      activityDate: daysAgo(85),
    },
    {
      cropId: MikunSoybean!._id,
      activityType: 'weeding',
      description: 'Hand weeding soybean plot to control broadleaf weeds at 4 WAP.',
      quantity: 'Full 0.6 ha',
      activityDate: daysAgo(57),
    },
    {
      cropId: MikunRaspberry!._id,
      activityType: 'planting',
      description: 'Planted Heritage raspberry canes in raised beds with compost base.',
      quantity: '80 canes',
      activityDate: daysAgo(70),
    },
    {
      cropId: MikunRaspberry!._id,
      activityType: 'irrigation',
      description: 'Drip irrigation installed and set to 1.5 L/plant/day for raspberries.',
      quantity: '120 L/day',
      activityDate: daysAgo(65),
    },

    // ── EMEKA ─────────────────────────────────────────────────────────────────
    {
      cropId: emekaTomato!._id,
      activityType: 'planting',
      description: 'Transplanted beefsteak tomato seedlings in double-row pattern on ridges.',
      quantity: '1,200 seedlings',
      activityDate: daysAgo(58),
    },
    {
      cropId: emekaTomato!._id,
      activityType: 'fertilizer',
      description: 'Fertigation with calcium nitrate solution — 5 kg per 100 L water.',
      quantity: '300 L solution',
      activityDate: daysAgo(30),
    },
    {
      cropId: emekaTomato!._id,
      activityType: 'pesticide',
      description: 'Applied Ridomil Gold MZ against late blight and soil-borne pathogens.',
      quantity: '12 litres',
      activityDate: daysAgo(15),
    },
    {
      cropId: emekaPepper!._id,
      activityType: 'planting',
      description: 'Transplanted Tatashe (large red pepper) seedlings into staked rows.',
      quantity: '800 seedlings',
      activityDate: daysAgo(52),
    },
    {
      cropId: emekaPepper!._id,
      activityType: 'irrigation',
      description: 'Supplemental drip irrigation during dry spell to avoid blossom drop.',
      quantity: '640 L/day',
      activityDate: daysAgo(20),
    },
    {
      cropId: emekaCorn!._id,
      activityType: 'planting',
      description: 'Planted IITA drought-tolerant maize variety DT-SR at 75cm × 25cm.',
      quantity: '6 kg seed',
      activityDate: daysAgo(72),
    },
    {
      cropId: emekaCorn!._id,
      activityType: 'irrigation',
      description: 'Overhead irrigation applied at critical tasselling stage of maize.',
      quantity: '25 mm',
      activityDate: daysAgo(45),
    },
    {
      cropId: emekaCorn!._id,
      activityType: 'fertilizer',
      description: 'Split urea application — second dose at tasselling for grain fill.',
      quantity: '3 bags (50 kg each)',
      activityDate: daysAgo(42),
    },
    {
      cropId: emekaSoybean!._id,
      activityType: 'planting',
      description: 'Planted soybean in rotation after maize using minimal tillage system.',
      quantity: '22 kg seed',
      activityDate: daysAgo(92),
    },
    {
      cropId: emekaSquash!._id,
      activityType: 'planting',
      description: 'Planted acorn squash on mounds with compost incorporated at planting.',
      quantity: '3 kg seed',
      activityDate: daysAgo(48),
    },
    {
      cropId: emekaSquash!._id,
      activityType: 'weeding',
      description: 'Manual weeding around squash mounds to prevent vine competition.',
      quantity: 'Full 0.6 ha',
      activityDate: daysAgo(25),
    },
    {
      cropId: emekaPotato!._id,
      activityType: 'planting',
      description: 'Planted Yukon Gold potato variety on earthed-up ridges at 30cm spacing.',
      quantity: '180 kg seed pieces',
      activityDate: daysAgo(82),
    },
    {
      cropId: emekaPotato!._id,
      activityType: 'pesticide',
      description: 'Mancozeb 80WP spray programme against early and late blight on potato.',
      quantity: '10 litres',
      activityDate: daysAgo(45),
    },
    {
      cropId: emekaOrange!._id,
      activityType: 'planting',
      description: 'Established Valencia orange orchard, trees budded on Trifoliate rootstock.',
      quantity: '40 trees',
      activityDate: daysAgo(150),
    },
    {
      cropId: emekaOrange!._id,
      activityType: 'fertilizer',
      description: 'Applied citrus-specific NPK 13-7-13 + micro-nutrients as broadcast.',
      quantity: '4 bags (25 kg each)',
      activityDate: daysAgo(80),
    },
    {
      cropId: emekaApple!._id,
      activityType: 'planting',
      description: 'Planted Anna × Dorsett Golden apple combo for mutual cross-pollination.',
      quantity: '35 trees',
      activityDate: daysAgo(140),
    },
    {
      cropId: emekaApple!._id,
      activityType: 'other',
      description: 'Formative pruning to establish open vase canopy shape on apple trees.',
      quantity: '35 trees',
      activityDate: daysAgo(70),
    },
    {
      cropId: emekaGrape!._id,
      activityType: 'planting',
      description: 'Planted Concord grape vines on overhead trellis at 2m × 3m spacing.',
      quantity: '70 vines',
      activityDate: daysAgo(110),
    },
    {
      cropId: emekaGrape!._id,
      activityType: 'other',
      description: 'Cane pruning to retain 2 canes × 8 buds per vine for fruiting wood.',
      quantity: '70 vines',
      activityDate: daysAgo(60),
    },
    {
      cropId: emekaPeach!._id,
      activityType: 'planting',
      description: 'Planted Flordaprince peach — low-chill 100-hour tropical adapted variety.',
      quantity: '22 trees',
      activityDate: daysAgo(105),
    },
    {
      cropId: emekaStrawberry!._id,
      activityType: 'planting',
      description: 'Planted day-neutral Seascape strawberry on raised beds with drip tape.',
      quantity: '500 runners',
      activityDate: daysAgo(55),
    },
    {
      cropId: emekaBlueberry!._id,
      activityType: 'planting',
      description: 'Planted Sunshine Blue blueberry in grow bags with acidic substrate pH 4.8.',
      quantity: '30 plants',
      activityDate: daysAgo(80),
    },
    {
      cropId: emekaBlueberry!._id,
      activityType: 'fertilizer',
      description: 'Applied sulphur-coated urea to maintain soil acidity for blueberries.',
      quantity: '3 kg',
      activityDate: daysAgo(45),
    },
  ]);
  console.log('✅  Created crop activity records');

  // ── Soil Data ─────────────────────────────────────────────────────────────
  await SoilDataModel.insertMany([
    { farmId: FlourishFarm1!._id,  ph: 6.4, nitrogen: 0.28, phosphorus: 0.16, potassium: 0.42, organicCarbon: 0.87, moistureLevel: 36, source: 'iSDA Africa Soil API', recordedAt: new Date() },
    { farmId: FlourishFarm2!._id,  ph: 6.1, nitrogen: 0.22, phosphorus: 0.13, potassium: 0.38, organicCarbon: 0.71, moistureLevel: 30, source: 'iSDA Africa Soil API', recordedAt: new Date() },
    { farmId: MikunFarm1!._id, ph: 6.6, nitrogen: 0.31, phosphorus: 0.18, potassium: 0.44, organicCarbon: 0.92, moistureLevel: 38, source: 'iSDA Africa Soil API', recordedAt: new Date() },
    { farmId: MikunFarm2!._id, ph: 6.3, nitrogen: 0.25, phosphorus: 0.15, potassium: 0.40, organicCarbon: 0.80, moistureLevel: 33, source: 'iSDA Africa Soil API', recordedAt: new Date() },
    { farmId: emekaFarm1!._id, ph: 5.8, nitrogen: 0.19, phosphorus: 0.11, potassium: 0.35, organicCarbon: 0.62, moistureLevel: 42, source: 'iSDA Africa Soil API', recordedAt: new Date() },
    { farmId: emekaFarm2!._id, ph: 6.0, nitrogen: 0.21, phosphorus: 0.14, potassium: 0.37, organicCarbon: 0.68, moistureLevel: 39, source: 'iSDA Africa Soil API', recordedAt: new Date() },
  ]);
  console.log('✅  Created 6 soil data records (1 per farm)');

  // ── Rotation History ─────────────────────────────────────────────────────
  await RotationHistoryModel.insertMany([
    {
      farmId: MikunFarm2!._id,
      cropId: MikunPotato!._id,
      previousCrop: 'Potato',
      seasonYear: 2025,
      recommendedNextCrop: 'Corn',
      reason: 'Corn is non-solanaceous, breaks potato disease cycles, and benefits from residual soil potassium.',
    },
    {
      farmId: FlourishFarm1!._id,
      cropId: FlourishSoybean!._id,
      previousCrop: 'Soybean',
      seasonYear: 2025,
      recommendedNextCrop: 'Corn',
      reason: 'Corn benefits from the residual nitrogen fixed by soybean in the previous season.',
    },
    {
      farmId: emekaFarm1!._id,
      cropId: emekaCorn!._id,
      previousCrop: 'Corn',
      seasonYear: 2025,
      recommendedNextCrop: 'Soybean',
      reason: 'Soybean restores soil nitrogen depleted by corn and helps break corn rootworm cycles.',
    },
    {
      farmId: FlourishFarm2!._id,
      cropId: FlourishSquash!._id,
      previousCrop: 'Squash',
      seasonYear: 2025,
      recommendedNextCrop: 'Tomato',
      reason: 'Tomato following squash improves land-use efficiency; allow a 3-year break from cucurbits after.',
    },
  ]);
  console.log('✅  Created 4 rotation history records');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉  Seeding complete!\n');
  console.log('🌿  Crop-type coverage (minimum 60% = 9 / 14 required)');
  console.log('   ┌──────────────────┬─────────────────────────────────────────────────┬──────┬──────┐');
  console.log('   │ User             │ Crop types                                      │ /14  │  %   │');
  console.log('   ├──────────────────┼─────────────────────────────────────────────────┼──────┼──────┤');
  console.log('   │ Flourish (Flourish)  │ Tomato Pepper Corn Potato Soybean Strawberry    │      │      │');
  console.log('   │                  │ Apple Grape Peach Cherry Squash Blueberry        │  12  │  86% │');
  console.log('   ├──────────────────┼─────────────────────────────────────────────────┼──────┼──────┤');
  console.log('   │ Mikun (Mikun)    │ Tomato Pepper Strawberry Cherry Apple Corn      │      │      │');
  console.log('   │                  │ Grape Peach Potato Soybean Raspberry             │  11  │  79% │');
  console.log('   ├──────────────────┼─────────────────────────────────────────────────┼──────┼──────┤');
  console.log('   │ Chukwu (Emeka)   │ Tomato Pepper Corn Soybean Squash Potato Orange │      │      │');
  console.log('   │                  │ Apple Grape Peach Strawberry Blueberry           │  12  │  86% │');
  console.log('   └──────────────────┴─────────────────────────────────────────────────┴──────┴──────┘\n');

  console.log('📋  Test Login Credentials (all passwords: "password123")');
  console.log('   ┌──────────────────────┬─────────────────────┐');
  console.log('   │ Name                 │ Phone               │');
  console.log('   ├──────────────────────┼─────────────────────┤');
  console.log('   │ Flourish Tiānshǐ     │ +2349158443073      │');
  console.log('   │ Mikun Qíngrén        │ +2349161285212      │');
  console.log('   │ Chukwu Emeka         │ +2348055551234      │');
  console.log('   └──────────────────────┴─────────────────────┘\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seeding failed:', err);
  process.exit(1);
});