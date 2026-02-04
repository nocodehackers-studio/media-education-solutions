import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeListTable } from './CodeListTable';
import type { Participant } from '../types/contest.types';

const createMockParticipant = (
  code: string,
  status: 'unused' | 'used',
  organizationName: string | null = null
): Participant => ({
  id: `id-${code}`,
  contestId: 'contest-123',
  code,
  status,
  organizationName,
  createdAt: '2026-01-13T00:00:00Z',
});

describe('CodeListTable', () => {
  it('renders table headers correctly', () => {
    const codes: Participant[] = [];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('displays code in monospace font', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    render(<CodeListTable codes={codes} />);

    const codeCell = screen.getByText('12345678');
    expect(codeCell).toHaveClass('font-mono');
  });

  it('displays unused codes with outline badge', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('Unused')).toBeInTheDocument();
  });

  it('displays used codes with default badge', () => {
    const codes: Participant[] = [
      createMockParticipant('12345678', 'used'),
    ];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('Used')).toBeInTheDocument();
  });

  it('shows organization name when provided', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused', 'Springfield Elementary')];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('Springfield Elementary')).toBeInTheDocument();
  });

  it('shows "-" for organization when not provided', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused', null)];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders multiple codes correctly', () => {
    const codes: Participant[] = [
      createMockParticipant('11111111', 'unused', 'School A'),
      createMockParticipant('22222222', 'used', 'School B'),
      createMockParticipant('33333333', 'unused', 'School C'),
    ];

    render(<CodeListTable codes={codes} />);

    expect(screen.getByText('11111111')).toBeInTheDocument();
    expect(screen.getByText('22222222')).toBeInTheDocument();
    expect(screen.getByText('33333333')).toBeInTheDocument();
    expect(screen.getByText('School A')).toBeInTheDocument();
    expect(screen.getByText('School B')).toBeInTheDocument();
    expect(screen.getByText('School C')).toBeInTheDocument();
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
