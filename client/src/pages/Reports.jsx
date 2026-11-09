import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import GlucoseChart from '../components/GlucoseChart';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

function Reports() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [dailyReport, setDailyReport] = useState(null);
  const [mtdReport, setMtdReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dailyRes, mtdRes, monthlyRes] = await Promise.all([
        api.get('/reports/daily', { params: { date: selectedDate } }),
        api.get('/reports/month-to-date', { params: { date: selectedDate } }),
        api.get('/reports/monthly', { params: { date: selectedDate } }),
      ]);

      setDailyReport(dailyRes.data.report);
      setMtdReport(mtdRes.data.report);
      setMonthlyReport(monthlyRes.data.report);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const renderStats = (report) => {
    if (!report || report.count === 0) {
      return (
        <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">No readings recorded for this period.</div>
        </div>
      );
    }

    return (
      <div className="report-stats">
        <div className="stat-item">
          <div className="stat-value high">{report.highest}</div>
          <div className="stat-label">Highest (mg/dl)</div>
        </div>
        <div className="stat-item">
          <div className="stat-value low">{report.lowest}</div>
          <div className="stat-label">Lowest (mg/dl)</div>
        </div>
        <div className="stat-item">
          <div className="stat-value average">
            {typeof report.average === 'number'
              ? report.average.toFixed(1)
              : report.average}
          </div>
          <div className="stat-label">Average (mg/dl)</div>
        </div>
        <div className="stat-item">
          <div className="stat-value count">{report.count}</div>
          <div className="stat-label">Total Readings</div>
        </div>
      </div>
    );
  };

  return (
    <div className="reports-page">
      <div className="dashboard-header">
        <div>
          <h1>Glucose Reports</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Summary analytics for your blood glucose records
          </p>
        </div>
        <div className="date-picker-group">
          <label htmlFor="report-date">Select Date:</label>
          <input
            id="report-date"
            type="date"
            value={selectedDate}
            max={getToday()}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Generating reports...</p>
        </div>
      ) : (
        <>
          <div className="reports-grid">
            {/* Daily Report */}
            <div className="card report-card">
              <div className="card-header">
                <div>
                  <h3 style={{ margin: 0 }}>📅 Daily Report</h3>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(selectedDate)}
                  </small>
                </div>
              </div>
              <div className="card-body">
                {renderStats(dailyReport)}

                {dailyReport && dailyReport.readings && dailyReport.readings.length > 0 && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                      Today's Readings:
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {dailyReport.readings.map((r) => (
                        <li
                          key={r.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.4rem 0',
                            borderBottom: '1px solid #f0f0f0',
                            fontSize: '0.9rem',
                          }}
                        >
                          <span>{SLOT_LABELS[r.slot] || r.slot}</span>
                          <strong>{r.value} mg/dl</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Month-to-Date Report */}
            <div className="card report-card">
              <div className="card-header">
                <div>
                  <h3 style={{ margin: 0 }}>📈 Month-to-Date</h3>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {mtdReport?.period
                      ? `${formatDate(mtdReport.period.from)} – ${formatDate(mtdReport.period.to)}`
                      : 'Current Month'}
                  </small>
                </div>
              </div>
              <div className="card-body">{renderStats(mtdReport)}</div>
            </div>

            {/* Monthly Report (Previous Month) */}
            <div className="card report-card">
              <div className="card-header">
                <div>
                  <h3 style={{ margin: 0 }}>🗓️ Previous Month</h3>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {monthlyReport?.period
                      ? `${formatDate(monthlyReport.period.from)} – ${formatDate(monthlyReport.period.to)}`
                      : 'Previous Month'}
                  </small>
                </div>
              </div>
              <div className="card-body">{renderStats(monthlyReport)}</div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <div className="card-header">
              📊 Glucose Trends (Current Month)
            </div>
            <div className="card-body">
              <GlucoseChart date={selectedDate} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
