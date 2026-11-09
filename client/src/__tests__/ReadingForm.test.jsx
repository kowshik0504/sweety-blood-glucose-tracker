import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReadingForm from '../components/ReadingForm';
import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('ReadingForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields and 4 slot options', () => {
    render(<ReadingForm selectedDate="2026-11-09" />);

    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time slot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/glucose value/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add reading/i })).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('Morning (fasting)');
    expect(options[1]).toHaveTextContent('After breakfast');
    expect(options[2]).toHaveTextContent('After lunch');
    expect(options[3]).toHaveTextContent('After dinner');
  });

  it('shows error "Please enter a glucose value." when submitting empty value', async () => {
    render(<ReadingForm selectedDate="2026-11-09" />);

    const submitBtn = screen.getByRole('button', { name: /add reading/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('Please enter a glucose value.')
    ).toBeInTheDocument();
  });

  it('shows error "Value must be between 40 and 600 mg/dl." when value is below 40', async () => {
    render(<ReadingForm selectedDate="2026-11-09" />);

    const valueInput = screen.getByLabelText(/glucose value/i);
    fireEvent.change(valueInput, { target: { value: '35' } });

    const submitBtn = screen.getByRole('button', { name: /add reading/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('Value must be between 40 and 600 mg/dl.')
    ).toBeInTheDocument();
  });

  it('shows error "Value must be between 40 and 600 mg/dl." when value is above 600', async () => {
    render(<ReadingForm selectedDate="2026-11-09" />);

    const valueInput = screen.getByLabelText(/glucose value/i);
    fireEvent.change(valueInput, { target: { value: '650' } });

    const submitBtn = screen.getByRole('button', { name: /add reading/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('Value must be between 40 and 600 mg/dl.')
    ).toBeInTheDocument();
  });

  it('shows error "Date cannot be in the future." when date is tomorrow', async () => {
    render(<ReadingForm selectedDate="2026-11-09" />);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const futureDateStr = tomorrow.toISOString().split('T')[0];

    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.change(dateInput, { target: { value: futureDateStr } });

    const valueInput = screen.getByLabelText(/glucose value/i);
    fireEvent.change(valueInput, { target: { value: '110' } });

    const submitBtn = screen.getByRole('button', { name: /add reading/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('Date cannot be in the future.')
    ).toBeInTheDocument();
  });

  it('successfully submits valid reading and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    api.post.mockResolvedValueOnce({ data: { reading: { id: 1, value: 120 } } });

    render(<ReadingForm selectedDate="2026-11-09" onSuccess={onSuccess} />);

    const valueInput = screen.getByLabelText(/glucose value/i);
    fireEvent.change(valueInput, { target: { value: '120' } });

    const submitBtn = screen.getByRole('button', { name: /add reading/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/readings', {
        date: '2026-11-09',
        slot: 'morning_fasting',
        value: 120,
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
