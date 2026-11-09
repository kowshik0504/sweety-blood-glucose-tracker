import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import ReadingForm from '../components/ReadingForm';
import ReadingList from '../components/ReadingList';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [editingReading, setEditingReading] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [page, setPage] = useState(1);

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/readings', {
        params: { date: selectedDate, page, limit: 20 },
      });
      setReadings(res.data.readings);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch readings:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, page]);

  const fetchDailyStats = useCallback(async () => {
    try {
      const res = await api.get('/reports/daily', {
        params: { date: selectedDate },
      });
      setDailyStats(res.data.report);
    } catch (err) {
      setDailyStats(null);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReadings();
    fetchDailyStats();
  }, [fetchReadings, fetchDailyStats]);

  useEffect(() => {
    setPage(1);
  }, [selectedDate]);

  const handleAddSuccess = () => {
    setSuccessMsg('Reading added successfully! ✅');
    setTimeout(() => setSuccessMsg(''), 3000);
    fetchReadings();
    fetchDailyStats();
  };

  const handleEditSuccess = () => {
    setSuccessMsg('Reading updated successfully! ✅');
    setTimeout(() => setSuccessMsg(''), 3000);
    setShowEditModal(false);
    setEditingReading(null);
    fetchReadings();
    fetchDailyStats();
  };

  const handleEdit = (reading) => {
    setEditingReading(reading);
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/readings/${id}`);
      setSuccessMsg('Reading deleted. 🗑️');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchReadings();
      fetchDailyStats();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingReading(null);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="date-picker-group">
          <label htmlFor="dashboard-date">Date:</label>
          <input
            id="dashboard-date"
            type="date"
            value={selectedDate}
            max={getToday()}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {formatDisplayDate(selectedDate)}
          </span>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Quick Stats */}
      {dailyStats && dailyStats.count > 0 && (
        <div className="quick-stats">
          <div className="quick-stat-card">
            <div className="stat-value high">{dailyStats.highest}</div>
            <div className="stat-label">Highest</div>
          </div>
          <div className="quick-stat-card">
            <div className="stat-value low">{dailyStats.lowest}</div>
            <div className="stat-label">Lowest</div>
          </div>
          <div className="quick-stat-card">
            <div className="stat-value average">
              {typeof dailyStats.average === 'number'
                ? dailyStats.average.toFixed(1)
                : dailyStats.average}
            </div>
            <div className="stat-label">Average</div>
          </div>
          <div className="quick-stat-card">
            <div className="stat-value count">{dailyStats.count}</div>
            <div className="stat-label">Readings</div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Add Reading */}
        <div className="card">
          <div className="card-header">➕ Add Reading</div>
          <div className="card-body">
            <ReadingForm
              onSuccess={handleAddSuccess}
              selectedDate={selectedDate}
            />
          </div>
        </div>

        {/* Readings List */}
        <div className="card">
          <div className="card-header">
            📋 Readings for {formatDisplayDate(selectedDate)}
          </div>
          <ReadingList
            readings={readings}
            onEdit={handleEdit}
            onDelete={handleDelete}
            pagination={pagination}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingReading && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <span>✏️ Edit Reading</span>
              <button className="modal-close-btn" onClick={handleCancelEdit}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              <ReadingForm
                editingReading={editingReading}
                onSuccess={handleEditSuccess}
                onCancelEdit={handleCancelEdit}
                selectedDate={selectedDate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
