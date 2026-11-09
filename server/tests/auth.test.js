const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRES_IN = '7d';

// Mock the database module
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() },
}));

const db = require('../src/config/db');
const app = require('../src/index');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201 with token', async () => {
      // Mock: no existing user
      db.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // SELECT check for existing email
        .mockResolvedValueOnce({
          rows: [{ id: 1, name: 'Test User', email: 'test@test.com' }],
          rowCount: 1,
        }); // INSERT user

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id', 1);
      expect(res.body.user).toHaveProperty('name', 'Test User');
      expect(res.body.user).toHaveProperty('email', 'test@test.com');
    });

    it('should return 409 for duplicate email', async () => {
      // Mock: existing user found
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'existing@test.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe('Email already registered.');
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Name is required.');
    });

    it('should return 400 when password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Password must be at least 6 characters.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return 200 with token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Test User', email: 'test@test.com', password: hashedPassword }],
        rowCount: 1,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id', 1);
      expect(res.body.user).toHaveProperty('name', 'Test User');
      expect(res.body.user).toHaveProperty('email', 'test@test.com');
    });

    it('should return 401 for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Test User', email: 'test@test.com', password: hashedPassword }],
        rowCount: 1,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password.');
    });

    it('should return 401 for non-existent email', async () => {
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password.');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user data with valid token', async () => {
      const token = jwt.sign({ id: 1, email: 'test@test.com' }, process.env.JWT_SECRET, { expiresIn: '7d' });

      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Test User', email: 'test@test.com' }],
        rowCount: 1,
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('id', 1);
      expect(res.body.user).toHaveProperty('name', 'Test User');
      expect(res.body.user).toHaveProperty('email', 'test@test.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('No token provided. Authorization denied.');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Token is not valid.');
    });
  });
});
