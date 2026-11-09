const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRealisticValue = (slot) => {
  switch (slot) {
    case 'morning_fasting':
      return getRandomInt(70, 130);
    case 'after_breakfast':
      return getRandomInt(100, 170);
    case 'after_lunch':
      return getRandomInt(90, 160);
    case 'after_dinner':
      return getRandomInt(95, 180);
    default:
      return getRandomInt(80, 150);
  }
};

const seed = async () => {
  try {
    // Run init.sql first to create tables
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await pool.query(sql);
    console.log('Tables created (or already exist).');

    // Create demo user
    const hashedPassword = await bcrypt.hash('Demo@123', 10);
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['Demo User', 'demo@sweety.com', hashedPassword]
    );

    let userId;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      console.log(`Demo user created with id: ${userId}`);
    } else {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        ['demo@sweety.com']
      );
      userId = existingUser.rows[0].id;
      console.log(`Demo user already exists with id: ${userId}`);
    }

    // Create sample readings for the past 30 days
    let readingsCreated = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Pick 2-4 random slots for this day
      const numReadings = getRandomInt(2, 4);
      const shuffledSlots = [...SLOTS].sort(() => Math.random() - 0.5);
      const selectedSlots = shuffledSlots.slice(0, numReadings);

      for (const slot of selectedSlots) {
        const value = getRealisticValue(slot);

        try {
          await pool.query(
            `INSERT INTO readings (user_id, date, slot, value)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, date, slot) DO NOTHING`,
            [userId, dateStr, slot, value]
          );
          readingsCreated++;
        } catch (err) {
          // Skip if duplicate
          if (err.code !== '23505') {
            console.error(`Error inserting reading for ${dateStr} ${slot}:`, err.message);
          }
        }
      }
    }

    console.log(`${readingsCreated} sample readings created.`);
    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seed();
