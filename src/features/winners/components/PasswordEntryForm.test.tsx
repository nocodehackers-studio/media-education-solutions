// Story 6-6: Tests for PasswordEntryForm component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordEntryForm } from './PasswordEntryForm';

// Mock the API
vi.mock('../api/publicWinnersApi', () => ({
  publicWinnersApi: {
    validatePassword: vi.fn(),
  },
}));

import { publicWinnersApi } from '../api/publicWinnersApi';

const mockOnSuccess = vi.fn();
const mockValidatePassword = vi.mocked(publicWinnersApi.validatePassword);

describe('PasswordEntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render password input and submit button', () => {
    render(
      <PasswordEntryForm
        contestCode="ABC123"
        contestName="Test Contest"
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Test Contest')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Results' })).toBeInTheDocument();
  });

  it('should call onSuccess with winners data when password is correct', async () => {
    const user = userEvent.setup();
    const mockWinners = [{ categoryId: '1', categoryName: 'Video', divisionName: 'Senior', winners: [] }];

    mockValidatePassword.mockResolvedValue({
      success: true,
      contestName: 'Test Contest',
      winners: mockWinners,
    });

    render(
      <PasswordEntryForm
        contestCode="ABC123"
        contestName="Test Contest"
        onSuccess={mockOnSuccess}
      />
    );

    await user.type(screen.getByPlaceholderText('Enter password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'View Results' }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('Test Contest', mockWinners);
    });
  });

  it('should show error when password is incorrect', async () => {
    const user = userEvent.setup();
    mockValidatePassword.mockResolvedValue({
      success: false,
      error: 'INCORRECT_PASSWORD',
    });

    render(
      <PasswordEntryForm
        contestCode="ABC123"
        contestName="Test Contest"
        onSuccess={mockOnSuccess}
      />
    );

    await user.type(screen.getByPlaceholderText('Enter password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'View Results' }));

    await waitFor(() => {
      expect(screen.getByText('Incorrect password')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should show unavailable message when winners page is revoked', async () => {
    const user = userEvent.setup();
    mockValidatePassword.mockResolvedValue({
      success: false,
      error: 'WINNERS_NOT_AVAILABLE',
    });

    render(
      <PasswordEntryForm
        contestCode="ABC123"
        contestName="Test Contest"
        onSuccess={mockOnSuccess}
      />
    );

    await user.type(screen.getByPlaceholderText('Enter password'), 'pass');
    await user.click(screen.getByRole('button', { name: 'View Results' }));

    await waitFor(() => {
      expect(screen.getByText('Results are not currently available.')).toBeInTheDocument();
    });
  });

  it('should disable button when password field is empty', () => {
    render(
      <PasswordEntryForm
        contestCode="ABC123"
        contestName="Test Contest"
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('button', { name: 'View Results' })).toBeDisabled();
  });

  it('should lock out after 5 failed password attempts', async () => {
    const user = userEvent.setup();
    mockValidatePassword.mockResolvedValue({
      success: false,
      error: 'INCORRECT_PASSWORD',
    });

    render(
      <PasswordEntryForm
        contestCode="ABC123"
        contestName="Test Contest"
        onSuccess={mockOnSuccess}
      />
    );

    // Submit 5 wrong passwords
    for (let i = 0; i < 5; i++) {
      await user.clear(screen.getByPlaceholderText('Enter password'));
      await user.type(screen.getByPlaceholderText('Enter password'), `wrong${i}`);
      await user.click(screen.getByRole('button', { name: 'View Results' }));
      await waitFor(() => {
        expect(mockValidatePassword).toHaveBeenCalledTimes(i + 1);
      });
    }

    // Should show lockout message and disable the form
    await waitFor(() => {
      expect(screen.getByText('Too many attempts. Please wait.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'View Results' })).toBeDisabled();
    expect(screen.getByPlaceholderText('Enter password')).toBeDisabled();
  });
});
