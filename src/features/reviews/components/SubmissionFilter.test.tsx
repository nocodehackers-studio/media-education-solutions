/**
 * SubmissionFilter Unit Tests - Story 5.1 (AC5)
 * Tests filter dropdown for submission review status
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmissionFilter } from './SubmissionFilter';

describe('SubmissionFilter', () => {
  it('renders with "All" as displayed value', () => {
    const onChange = vi.fn();
    render(<SubmissionFilter value="all" onChange={onChange} />);
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('shows dropdown with three options', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SubmissionFilter value="all" onChange={onChange} />);

    // Open the select
    await user.click(screen.getByRole('combobox'));

    // Check options are visible
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Reviewed' })).toBeInTheDocument();
  });

  it('calls onChange when option selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SubmissionFilter value="all" onChange={onChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Pending' }));

    expect(onChange).toHaveBeenCalledWith('pending');
  });
});
