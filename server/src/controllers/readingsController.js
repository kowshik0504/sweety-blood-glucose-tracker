const db = require('../config/db');

const VALID_SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];

const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

const getReadings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const { date } = req.query;
    const userId = req.user.id;

    let countQuery = 'SELECT COUNT(*) FROM readings WHERE user_id = $1';
    let dataQuery = 'SELECT id, user_id, date, slot, value, created_at, updated_at FROM readings WHERE user_id = $1';
    const params = [userId];

    if (date) {
      countQuery += ' AND date = $2';
      dataQuery += ' AND date = $2';
      params.push(date);
    }

    dataQuery += ' ORDER BY date DESC, slot';
    dataQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const dataResult = await db.query(dataQuery, dataParams);

    const readings = dataResult.rows.map((row) => ({
      ...row,
      slotLabel: SLOT_LABELS[row.slot] || row.slot,
    }));

    res.status(200).json({
      readings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const addReading = async (req, res, next) => {
  try {
    const { date, slot, value } = req.body;
    const userId = req.user.id;

    // Validate value
    if (value === undefined || value === null || value === '') {
      return res.status(400).json({ error: { message: 'Please enter a glucose value.' } });
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 40 || numValue > 600) {
      return res.status(400).json({ error: { message: 'Value must be between 40 and 600 mg/dl.' } });
    }

    // Validate slot
    if (!slot || !VALID_SLOTS.includes(slot)) {
      return res.status(400).json({ error: { message: 'Slot must be one of: morning_fasting, after_breakfast, after_lunch, after_dinner.' } });
    }

    // Validate date
    if (!date) {
      return res.status(400).json({ error: { message: 'Date is required.' } });
    }

    const readingDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (readingDate > today) {
      return res.status(400).json({ error: { message: 'Date cannot be in the future.' } });
    }

    // Check count of readings for that date
    const countResult = await db.query(
      'SELECT COUNT(*) FROM readings WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    const readingCount = parseInt(countResult.rows[0].count, 10);
    if (readingCount >= 4) {
      return res.status(400).json({ error: { message: 'You can add only 4 readings per day.' } });
    }

    // Check if slot already exists for that date
    const existingSlot = await db.query(
      'SELECT id FROM readings WHERE user_id = $1 AND date = $2 AND slot = $3',
      [userId, date, slot]
    );
    if (existingSlot.rows.length > 0) {
      const slotLabel = SLOT_LABELS[slot] || slot;
      return res.status(400).json({ error: { message: `You already have an ${slotLabel} reading for this date.` } });
    }

    // Insert reading
    const result = await db.query(
      'INSERT INTO readings (user_id, date, slot, value) VALUES ($1, $2, $3, $4) RETURNING id, user_id, date, slot, value, created_at, updated_at',
      [userId, date, slot, numValue]
    );

    const reading = {
      ...result.rows[0],
      slotLabel: SLOT_LABELS[result.rows[0].slot] || result.rows[0].slot,
    };

    res.status(201).json({ reading });
  } catch (err) {
    next(err);
  }
};

const getReadingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, user_id, date, slot, value, created_at, updated_at FROM readings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Reading not found.' } });
    }

    const reading = {
      ...result.rows[0],
      slotLabel: SLOT_LABELS[result.rows[0].slot] || result.rows[0].slot,
    };

    res.status(200).json({ reading });
  } catch (err) {
    next(err);
  }
};

const updateReading = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, slot, value } = req.body;
    const userId = req.user.id;

    // Check if reading exists and belongs to user
    const existingResult = await db.query(
      'SELECT id, date, slot FROM readings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Reading not found.' } });
    }

    const existing = existingResult.rows[0];

    // Validate value
    if (value === undefined || value === null || value === '') {
      return res.status(400).json({ error: { message: 'Please enter a glucose value.' } });
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 40 || numValue > 600) {
      return res.status(400).json({ error: { message: 'Value must be between 40 and 600 mg/dl.' } });
    }

    // Validate slot
    if (!slot || !VALID_SLOTS.includes(slot)) {
      return res.status(400).json({ error: { message: 'Slot must be one of: morning_fasting, after_breakfast, after_lunch, after_dinner.' } });
    }

    // Validate date
    if (!date) {
      return res.status(400).json({ error: { message: 'Date is required.' } });
    }

    const readingDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (readingDate > today) {
      return res.status(400).json({ error: { message: 'Date cannot be in the future.' } });
    }

    // Check if slot already exists for that date (exclude current reading)
    const existingDateStr = existing.date instanceof Date
      ? existing.date.toISOString().split('T')[0]
      : String(existing.date);

    const isSameSlotAndDate = (slot === existing.slot && date === existingDateStr);

    if (!isSameSlotAndDate) {
      const duplicateSlot = await db.query(
        'SELECT id FROM readings WHERE user_id = $1 AND date = $2 AND slot = $3 AND id != $4',
        [userId, date, slot, id]
      );
      if (duplicateSlot.rows.length > 0) {
        const slotLabel = SLOT_LABELS[slot] || slot;
        return res.status(400).json({ error: { message: `You already have an ${slotLabel} reading for this date.` } });
      }

      // Check count for the new date (exclude current reading if it's the same date)
      const countResult = await db.query(
        'SELECT COUNT(*) FROM readings WHERE user_id = $1 AND date = $2 AND id != $3',
        [userId, date, id]
      );
      const readingCount = parseInt(countResult.rows[0].count, 10);
      if (readingCount >= 4) {
        return res.status(400).json({ error: { message: 'You can add only 4 readings per day.' } });
      }
    }

    // Update reading
    const result = await db.query(
      'UPDATE readings SET date = $1, slot = $2, value = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING id, user_id, date, slot, value, created_at, updated_at',
      [date, slot, numValue, id, userId]
    );

    const reading = {
      ...result.rows[0],
      slotLabel: SLOT_LABELS[result.rows[0].slot] || result.rows[0].slot,
    };

    res.status(200).json({ reading });
  } catch (err) {
    next(err);
  }
};

const deleteReading = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id FROM readings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Reading not found.' } });
    }

    await db.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [id, userId]);

    res.status(200).json({ message: 'Reading deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReadings,
  addReading,
  getReadingById,
  updateReading,
  deleteReading,
};
