import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeListTable } from './CodeListTable';
import type { Participant } from '../types/contest.types';

const createMockParticipant = (
  code: string,
  status: 'unused' | 'used',
  name: string | null = null,
  organizationName: string | null = null
): Participant => ({
  id: `id-${code}`,
  contestId: 'contest-123',
  code,
  status,
  name,
  organizationName,
  tlcName: null,
  tlcEmail: null,
  createdAt: '2026-01-13T00:00:00Z',
});

describe('CodeListTable', () => {
  it('renders table headers correctly (AC1 Updated)', () => {
    const codes: Participant[] = [];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
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
    const codes: Participant[] = [createMockParticipant('12345678', 'unused', null, 'Test School')];

    render(<CodeListTable codes={codes} />);

    // Should show "-" for participant name only (organization has value)
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('shows organization name when provided (AC1 Updated)', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused', null, 'Springfield Elementary')];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('Springfield Elementary')).toBeInTheDocument();
  });

  it('shows "-" for organization when not provided', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused', null, null)];

    render(<CodeListTable codes={codes} />);

    // Should show "-" for both organization and participant name
    const dashes = screen.getAllByText('-');
    expect(dashes).toHaveLength(2);
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
      createMockParticipant('11111111', 'unused', null, 'School A'),
      createMockParticipant('22222222', 'used', 'Alice', 'School B'),
      createMockParticipant('33333333', 'unused', null, 'School C'),
    ];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('11111111')).toBeInTheDocument();
    expect(screen.getByText('22222222')).toBeInTheDocument();
    expect(screen.getByText('33333333')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('School A')).toBeInTheDocument();
    expect(screen.getByText('School B')).toBeInTheDocument();
    expect(screen.getByText('School C')).toBeInTheDocument();
    // Should have 2 "-" for unused codes (participant name column)
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
