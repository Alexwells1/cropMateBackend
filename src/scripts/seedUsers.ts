/**
 * CropMate — Quick test user seeder
 * Run: npm run seed:users
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { UserModel } from '../modules/auth/repository/user.model';

const TEST_USERS = [
  { name: 'Test Farmer A', phone: '+2349000000001' },
  { name: 'Test Farmer B', phone: '+2349000000002' },
  { name: 'Test Farmer C', phone: '+2349000000003' },
];

async function run(): Promise<void> {
  await mongoose.connect(config.database.mongoUri);
  const passwordHash = await bcrypt.hash('testpass123', 12);

  for (const u of TEST_USERS) {
    await UserModel.findOneAndUpdate(
      { phone: u.phone },
      { ...u, passwordHash },
      { upsert: true, new: true }
    );
    console.log(`✅  Upserted: ${u.name} (${u.phone}) — password: testpass123`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
