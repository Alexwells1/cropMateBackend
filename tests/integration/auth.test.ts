import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../src/app';

const app = createApp();

beforeAll(async () => {
  await mongoose.connect(process.env['MONGODB_URI_TEST'] as string);
  await mongoose.connection.db?.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.db?.dropDatabase();
  await mongoose.disconnect();
});

describe('POST /api/v1/auth/register', () => {
  const user = {
    name: 'Musa Ibrahim',
    phone: '+2348011111111',
    password: 'securePass123',
  };

  it('registers a new user and returns token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(user)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.phone).toBe(user.phone);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate phone registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(user)
      .expect(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: '+2348022222222', password: 'pass123' })
      .expect(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('rejects invalid phone format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...user, phone: 'not-a-phone', password: 'pass123' })
      .expect(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'X', phone: '+2348033333333', password: '123' })
      .expect(422);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/login', () => {
  const creds = { phone: '+2348011111111', password: 'securePass123' };

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send(creds)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ ...creds, password: 'wrongpassword' })
      .expect(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects unknown phone', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '+2348099999999', password: 'pass123' })
      .expect(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/auth/profile', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '+2348011111111', password: 'securePass123' });
    token = res.body.data.token as string;
  });

  it('returns profile with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe('+2348011111111');
  });

  it('returns 401 without token', async () => {
    await request(app).get('/api/v1/auth/profile').expect(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);
    expect(res.body.success).toBe(false);
  });
});
