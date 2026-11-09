const db = require('../config/db');

const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

const emptyReport = (from, to) => ({
  report: {
    highest: null,
    lowest: null,
    average: null,
    count: 0,
    readings: [],
    period: { from, to },
  },
});

const getDailyReport = async (req, res, next) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    if (!date) {
      return res.status(400).json({ error: { message: 'Date query parameter is required.' } });
    }

    // Get individual readings
    const readingsResult = await db.query(
      'SELECT id, date, slot, value, created_at FROM readings WHERE user_id = $1 AND date = $2 ORDER BY slot',
      [userId, date]
    );

    if (readingsResult.rows.length === 0) {
      return res.status(200).json(emptyReport(date, date));
    }

    // Get aggregates
    const aggResult = await db.query(
      'SELECT MAX(value) AS highest, MIN(value) AS lowest, ROUND(AVG(value)::numeric, 1) AS average, COUNT(*) AS count FROM readings WHERE user_id = $1 AND date = $2',
      [userId, date]
    );

    const agg = aggResult.rows[0];
    const readings = readingsResult.rows.map((row) => ({
      ...row,
      slotLabel: SLOT_LABELS[row.slot] || row.slot,
    }));

    res.status(200).json({
      report: {
        highest: parseInt(agg.highest, 10),
        lowest: parseInt(agg.lowest, 10),
        average: parseFloat(agg.average),
        count: parseInt(agg.count, 10),
        readings,
        period: { from: date, to: date },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMonthToDateReport = async (req, res, next) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    if (!date) {
      return res.status(400).json({ error: { message: 'Date query parameter is required.' } });
    }

    // Calculate first of month
    const dateParts = date.split('-');
    const firstOfMonth = `${dateParts[0]}-${dateParts[1]}-01`;

    const aggResult = await db.query(
      'SELECT MAX(value) AS highest, MIN(value) AS lowest, ROUND(AVG(value)::numeric, 1) AS average, COUNT(*) AS count FROM readings WHERE user_id = $1 AND date >= $2 AND date <= $3',
      [userId, firstOfMonth, date]
    );

    const agg = aggResult.rows[0];

    if (parseInt(agg.count, 10) === 0) {
      return res.status(200).json(emptyReport(firstOfMonth, date));
    }

    res.status(200).json({
      report: {
        highest: parseInt(agg.highest, 10),
        lowest: parseInt(agg.lowest, 10),
        average: parseFloat(agg.average),
        count: parseInt(agg.count, 10),
        readings: [],
        period: { from: firstOfMonth, to: date },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    if (!date) {
      return res.status(400).json({ error: { message: 'Date query parameter is required.' } });
    }

    // Calculate previous month range
    const givenDate = new Date(date + 'T00:00:00');
    const firstOfPrevMonth = new Date(givenDate.getFullYear(), givenDate.getMonth() - 1, 1);
    const lastOfPrevMonth = new Date(givenDate.getFullYear(), givenDate.getMonth(), 0);

    const fromStr = firstOfPrevMonth.toISOString().split('T')[0];
    const toStr = lastOfPrevMonth.toISOString().split('T')[0];

    const aggResult = await db.query(
      'SELECT MAX(value) AS highest, MIN(value) AS lowest, ROUND(AVG(value)::numeric, 1) AS average, COUNT(*) AS count FROM readings WHERE user_id = $1 AND date >= $2 AND date <= $3',
      [userId, fromStr, toStr]
    );

    const agg = aggResult.rows[0];

    if (parseInt(agg.count, 10) === 0) {
      return res.status(200).json(emptyReport(fromStr, toStr));
    }

    res.status(200).json({
      report: {
        highest: parseInt(agg.highest, 10),
        lowest: parseInt(agg.lowest, 10),
        average: parseFloat(agg.average),
        count: parseInt(agg.count, 10),
        readings: [],
        period: { from: fromStr, to: toStr },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport,
};
