const request = require('supertest');
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

const testToken = jwt.sign({ id: 1, email: 'test@test.com' }, process.env.JWT_SECRET, { expiresIn: '7d' });

const today = new Date().toISOString().split('T')[0];

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 5);
const futureDateStr = futureDate.toISOString().split('T')[0];

describe('Readings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/readings', () => {
    it('should create a new reading and return 201', async () => {
      // Mock: count check returns 0
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 }) // count for date
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // existing slot check
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            user_id: 1,
            date: today,
            slot: 'morning_fasting',
            value: 95,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }],
          rowCount: 1,
        }); // INSERT

      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ date: today, slot: 'morning_fasting', value: 95 });

      expect(res.status).toBe(201);
      expect(res.body.reading).toHaveProperty('id', 1);
      expect(res.body.reading).toHaveProperty('value', 95);
      expect(res.body.reading).toHaveProperty('slotLabel', 'Morning (fasting)');
    });

    it('should return 400 when value is missing', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ date: today, slot: 'morning_fasting' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Please enter a glucose value.');
    });

    it('should return 400 when value is out of range (700)', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ date: today, slot: 'morning_fasting', value: 700 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('should return 400 when value is below range (30)', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ date: today, slot: 'morning_fasting', value: 30 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('should return 400 for future date', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ date: futureDateStr, slot: 'morning_fasting', value: 95 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Date cannot be in the future.');
    });

    it('should return 400 for invalid slot', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ date: today, slot: 'invalid_slot', value: 95 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Slot must be one of: morning_fasting, after_breakfast, after_lunch, after_dinner.');
    });

    it('should return 400 when 4 readings already exist for the date', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '4' }], rowCount: 1 });

      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ date: today, slot: 'morning_fasting', value: 95 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('You can add only 4 readings per day.');
    });

    it('should return 400 when slot already exists for that date', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 }) // count check
        .mockResolvedValueOnce({ rows: [{ id: 5 }], rowCount: 1 }); // existing slot found

      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ date: today, slot: 'after_lunch', value: 120 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('You already have an After lunch reading for this date.');
    });
  });

  describe('GET /api/readings', () => {
    it('should return readings with pagination', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }], rowCount: 1 }) // count
        .mockResolvedValueOnce({
          rows: [
            { id: 1, user_id: 1, date: today, slot: 'morning_fasting', value: 95, created_at: new Date(), updated_at: new Date() },
            { id: 2, user_id: 1, date: today, slot: 'after_lunch', value: 130, created_at: new Date(), updated_at: new Date() },
          ],
          rowCount: 2,
        }); // data

      const res = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('readings');
      expect(res.body.readings).toHaveLength(2);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('total', 2);
    });
  });

  describe('PUT /api/readings/:id', () => {
    it('should update a reading and return 200', async () => {
      db.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, date: today, slot: 'morning_fasting' }],
          rowCount: 1,
        }) // find existing
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            user_id: 1,
            date: today,
            slot: 'morning_fasting',
            value: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }],
          rowCount: 1,
        }); // UPDATE (same slot/date, skip dup check)

      const res = await request(app)
        .put('/api/readings/1')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ date: today, slot: 'morning_fasting', value: 100 });

      expect(res.status).toBe(200);
      expect(res.body.reading).toHaveProperty('value', 100);
    });

    it('should return 404 when reading not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await request(app)
        .put('/api/readings/999')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ date: today, slot: 'morning_fasting', value: 100 });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Reading not found.');
    });
  });

  describe('DELETE /api/readings/:id', () => {
    it('should delete a reading and return 200', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // find
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // DELETE

      const res = await request(app)
        .delete('/api/readings/1')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Reading deleted successfully');
    });

    it('should return 404 when reading not found for delete', async () => {
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const res = await request(app)
        .delete('/api/readings/999')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Reading not found.');
    });
  });
});
