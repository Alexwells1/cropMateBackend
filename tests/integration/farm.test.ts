import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';

const app = createApp();
let token: string;

beforeAll(async () => {
  await mongoose.connect(process.env['MONGODB_URI_TEST'] as string);
  await mongoose.connection.db?.dropDatabase();

  // Register and login
  await request(app).post('/api/v1/auth/register').send({
    name: 'Farm Test User',
    phone: '+2348044444444',
    password: 'testpass123',
  });

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ phone: '+2348044444444', password: 'testpass123' });
  token = res.body.data.token as string;
});

afterAll(async () => {
  await mongoose.connection.db?.dropDatabase();
  await mongoose.disconnect();
});

const validFarm = {
  farmName: 'Test Farm',
  farmSize: 3.5,
  location: { latitude: 6.5244, longitude: 3.3792 },
  soilType: 'Loamy',
};

describe('POST /api/v1/farms', () => {
  it('creates a farm for authenticated user', async () => {
    const res = await request(app)
      .post('/api/v1/farms')
      .set('Authorization', `Bearer ${token}`)
      .send(validFarm)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.farmName).toBe('Test Farm');
    expect(res.body.data.soilType).toBe('Loamy');
  });

  it('rejects request without auth', async () => {
    await request(app).post('/api/v1/farms').send(validFarm).expect(401);
  });

  it('rejects invalid soilType', async () => {
    const res = await request(app)
      .post('/api/v1/farms')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validFarm, soilType: 'Mud' })
      .expect(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing location', async () => {
    const { location: _loc, ...noLocation } = validFarm;
    const res = await request(app)
      .post('/api/v1/farms')
      .set('Authorization', `Bearer ${token}`)
      .send(noLocation)
      .expect(422);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/farms/user', () => {
  it('returns all farms for the user', async () => {
    const res = await request(app)
      .get('/api/v1/farms/user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
