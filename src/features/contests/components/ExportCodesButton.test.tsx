import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportCodesButton } from './ExportCodesButton';
import type { Participant } from '../types/contest.types';
import * as exportModule from '../utils/exportCodesToCSV';

// Mock the export function
vi.mock('../utils/exportCodesToCSV', () => ({
  exportCodesToCSV: vi.fn(),
}));

const createMockParticipant = (
  code: string,
  status: 'unused' | 'used'
): Participant => ({
  id: `id-${code}`,
  contestId: 'contest-123',
  code,
  status,
  name: null,
  organizationName: null,
  tlcName: null,
  tlcEmail: null,
  createdAt: '2026-01-13T00:00:00Z',
});

describe('ExportCodesButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders button with correct text', () => {
    const codes = [createMockParticipant('12345678', 'unused')];

    render(<ExportCodesButton codes={codes} contestCode="ABC123" />);

    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('is disabled when no codes exist', () => {
    render(<ExportCodesButton codes={[]} contestCode="ABC123" />);

    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });

  it('is enabled when codes exist', () => {
    const codes = [createMockParticipant('12345678', 'unused')];

    render(<ExportCodesButton codes={codes} contestCode="ABC123" />);

    expect(screen.getByRole('button', { name: 'Export' })).not.toBeDisabled();
  });

  it('calls exportCodesToCSV with correct arguments when clicked', () => {
    const codes = [
      createMockParticipant('12345678', 'unused'),
      createMockParticipant('87654321', 'used'),
    ];

    render(<ExportCodesButton codes={codes} contestCode="XYZ789" />);

    fireEvent.click(screen.getByRole('button'));

    expect(exportModule.exportCodesToCSV).toHaveBeenCalledWith(codes, 'XYZ789');
  });

  it('does not call export when disabled', () => {
    render(<ExportCodesButton codes={[]} contestCode="ABC123" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Button should be disabled so export shouldn't be called
    expect(exportModule.exportCodesToCSV).not.toHaveBeenCalled();
  });
});
