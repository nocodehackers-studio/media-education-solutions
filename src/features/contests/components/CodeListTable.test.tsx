import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeListTable } from './CodeListTable';
import type { Participant } from '../types/contest.types';

const createMockParticipant = (
  code: string,
  status: 'unused' | 'used',
  name: string | null = null
): Participant => ({
  id: `id-${code}`,
  contestId: 'contest-123',
  code,
  status,
  name,
  organizationName: null,
  tlcName: null,
  tlcEmail: null,
  createdAt: '2026-01-13T00:00:00Z',
});

describe('CodeListTable', () => {
  it('renders table headers correctly', () => {
    const codes: Participant[] = [];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Participant Name')).toBeInTheDocument();
  });

  it('displays code in monospace font', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    render(<CodeListTable codes={codes} />);

    const codeCell = screen.getByText('12345678');
    expect(codeCell).toHaveClass('font-mono');
  });

  it('displays unused codes with outline badge (UX19)', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('Unused')).toBeInTheDocument();
  });

  it('displays used codes with default badge', () => {
    const codes: Participant[] = [
      createMockParticipant('12345678', 'used', 'John Doe'),
    ];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('Used')).toBeInTheDocument();
  });

  it('shows "-" for unused codes in participant name column (AC2)', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows participant name for used codes (AC2)', () => {
    const codes: Participant[] = [
      createMockParticipant('12345678', 'used', 'Jane Smith'),
    ];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows "Unknown" for used codes without name', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'used', null)];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('renders multiple codes correctly', () => {
    const codes: Participant[] = [
      createMockParticipant('11111111', 'unused'),
      createMockParticipant('22222222', 'used', 'Alice'),
      createMockParticipant('33333333', 'unused'),
    ];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('11111111')).toBeInTheDocument();
    expect(screen.getByText('22222222')).toBeInTheDocument();
    expect(screen.getByText('33333333')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    // Should have 2 "-" for unused codes
    expect(screen.getAllByText('-')).toHaveLength(2);
  });

  it('renders empty table when no codes provided', () => {
    const codes: Participant[] = [];

    render(<CodeListTable codes={codes} />);

    // Table should exist with headers
    expect(screen.getByRole('table')).toBeInTheDocument();
    // But no data rows
    expect(screen.queryByText('12345678')).not.toBeInTheDocument();
  });
});
