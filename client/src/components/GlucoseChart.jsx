import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import api from '../api/axios';

const SLOT_SHORT = {
  morning_fasting: 'Fasting',
  after_breakfast: 'Breakfast',
  after_lunch: 'Lunch',
  after_dinner: 'Dinner',
};

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function GlucoseChart({ date }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadMonthlyData() {
      setLoading(true);
      try {
        // Fetch up to 100 readings for the month
        const res = await api.get('/readings', {
          params: { page: 1, limit: 100 },
        });

        if (isMounted) {
          const readings = res.data.readings || [];
          // Filter readings belonging to the selected month
          const selectedMonth = date ? date.slice(0, 7) : new Date().toISOString().slice(0, 7);
          const filtered = readings
            .filter((r) => r.date.startsWith(selectedMonth))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          const chartData = filtered.map((r) => ({
            id: r.id,
            date: formatShortDate(r.date),
            rawDate: r.date,
            slot: SLOT_SHORT[r.slot] || r.slot,
            value: r.value,
          }));

          setData(chartData);
        }
      } catch (err) {
        console.error('Failed to load chart data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMonthlyData();
    return () => {
      isMounted = false;
    };
  }, [date]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading glucose trends...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📈</div>
        <div className="empty-state-text">No readings recorded this month to display trend.</div>
      </div>
    );
  }

  return (
    <div className="chart-wrapper">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: 10, height: 10, backgroundColor: '#2ecc71', borderRadius: '50%' }}></span>
          Normal (70–140 mg/dl)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ width: 10, height: 10, backgroundColor: '#e74c3c', borderRadius: '50%' }}></span>
          Target boundaries
        </span>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[40, 'auto']} tick={{ fontSize: 12 }} unit=" mg/dl" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div
                      style={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div><strong>{item.date}</strong> ({item.slot})</div>
                      <div style={{ color: '#4A90D9', fontWeight: 'bold' }}>
                        {item.value} mg/dl
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={70} stroke="#e74c3c" strokeDasharray="3 3" label={{ value: 'Low (70)', fill: '#e74c3c', fontSize: 11 }} />
            <ReferenceLine y={140} stroke="#f39c12" strokeDasharray="3 3" label={{ value: 'Normal (140)', fill: '#f39c12', fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4A90D9"
              strokeWidth={2}
              dot={{ r: 4, fill: '#4A90D9' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GlucoseChart;
