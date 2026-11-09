import React from 'react';

const SLOT_LABELS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

const SLOT_BADGE_CLASSES = {
  morning_fasting: 'slot-morning',
  after_breakfast: 'slot-breakfast',
  after_lunch: 'slot-lunch',
  after_dinner: 'slot-dinner',
};

function getGlucoseClass(value) {
  if (value < 70) return 'glucose-value very-low';
  if (value <= 140) return 'glucose-value normal';
  if (value <= 200) return 'glucose-value elevated';
  return 'glucose-value very-high';
}

function ReadingList({ readings, onEdit, onDelete, pagination, onPageChange, loading }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading readings...</p>
      </div>
    );
  }

  if (!readings || readings.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <div className="empty-state-text">No readings for this date. Add your first reading above!</div>
      </div>
    );
  }

  return (
    <div>
      <div className="table-responsive">
        <table className="readings-table">
          <thead>
            <tr>
              <th>Time Slot</th>
              <th>Glucose Value</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => (
              <tr key={reading.id}>
                <td>
                  <span className={`slot-badge ${SLOT_BADGE_CLASSES[reading.slot] || ''}`}>
                    {SLOT_LABELS[reading.slot] || reading.slot}
                  </span>
                </td>
                <td>
                  <span className={getGlucoseClass(reading.value)}>
                    <strong>{reading.value}</strong> mg/dl
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => onEdit(reading)}
                    style={{ marginRight: '0.5rem' }}
                    title="Edit reading"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (window.confirm(`Delete reading of ${reading.value} mg/dl for ${SLOT_LABELS[reading.slot] || reading.slot}?`)) {
                        onDelete(reading.id);
                      }
                    }}
                    title="Delete reading"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            className="pagination-btn"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default ReadingList;
