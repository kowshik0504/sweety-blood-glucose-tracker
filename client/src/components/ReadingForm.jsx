import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const SLOTS = [
  { value: 'morning_fasting', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function ReadingForm({ onSuccess, editingReading, onCancelEdit, selectedDate }) {
  const [date, setDate] = useState(selectedDate || getToday());
  const [slot, setSlot] = useState('morning_fasting');
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingReading) {
      setDate(editingReading.date ? editingReading.date.split('T')[0] : selectedDate);
      setSlot(editingReading.slot || 'morning_fasting');
      setValue(editingReading.value != null ? String(editingReading.value) : '');
    }
  }, [editingReading, selectedDate]);

  useEffect(() => {
    if (!editingReading) {
      setDate(selectedDate || getToday());
    }
  }, [selectedDate, editingReading]);

  const validate = () => {
    const errs = {};

    if (value === '' || value === null || value === undefined) {
      errs.value = 'Please enter a glucose value.';
    } else {
      const numVal = Number(value);
      if (!Number.isInteger(numVal) || numVal < 40 || numVal > 600) {
        errs.value = 'Value must be between 40 and 600 mg/dl.';
      }
    }

    const today = getToday();
    if (date > today) {
      errs.date = 'Date cannot be in the future.';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = { date, slot, value: Number(value) };
      if (editingReading) {
        await api.put(`/readings/${editingReading._id || editingReading.id}`, payload);
      } else {
        await api.post('/readings', payload);
      }
      setValue('');
      setSlot('morning_fasting');
      setErrors({});
      setApiError('');
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Something went wrong. Please try again.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {apiError && <div className="alert alert-error">{apiError}</div>}

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="reading-date">
            Date
          </label>
          <input
            id="reading-date"
            className={`form-input ${errors.date ? 'error' : ''}`}
            type="date"
            value={date}
            max={getToday()}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && <span className="form-error">{errors.date}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="reading-slot">
            Time Slot
          </label>
          <select
            id="reading-slot"
            className="form-select"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          >
            {SLOTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label className="form-label" htmlFor="reading-value">
          Glucose Value (mg/dl)
        </label>
        <input
          id="reading-value"
          className={`form-input ${errors.value ? 'error' : ''}`}
          type="number"
          placeholder="Enter glucose value in mg/dl"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min="40"
          max="600"
        />
        {errors.value && <span className="form-error">{errors.value}</span>}
      </div>

      <div className="btn-group" style={{ marginTop: '1.25rem' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting
            ? editingReading
              ? 'Updating...'
              : 'Adding...'
            : editingReading
            ? 'Update Reading'
            : 'Add Reading'}
        </button>
        {editingReading && onCancelEdit && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ReadingForm;
