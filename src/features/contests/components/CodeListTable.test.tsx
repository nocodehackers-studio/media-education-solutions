import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it('renders table headers correctly', () => {
    const codes: Participant[] = [];

    renderWithProviders(<CodeListTable codes={codes} contestId="contest-123" />);

    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('displays code in monospace font', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    renderWithProviders(<CodeListTable codes={codes} contestId="contest-123" />);

    const codeCell = screen.getByText('12345678');
    expect(codeCell).toHaveClass('font-mono');
  });

  it('displays unused codes with outline badge', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    renderWithProviders(<CodeListTable codes={codes} contestId="contest-123" />);

    expect(screen.getByText('Unused')).toBeInTheDocument();
  });

  it('displays used codes with default badge', () => {
    const codes: Participant[] = [
      createMockParticipant('12345678', 'used'),
    ];

    renderWithProviders(<CodeListTable codes={codes} contestId="contest-123" />);

    expect(screen.getByText('Used')).toBeInTheDocument();
  });

  it('shows organization name when provided', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused', 'Springfield Elementary')];

    renderWithProviders(<CodeListTable codes={codes} contestId="contest-123" />);

    expect(screen.getByText('Springfield Elementary')).toBeInTheDocument();
  });

  it('shows "-" for organization when not provided', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused', null)];

    renderWithProviders(<CodeListTable codes={codes} contestId="contest-123" />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders multiple codes correctly', () => {
    const codes: Participant[] = [
      createMockParticipant('11111111', 'unused', 'School A'),
      createMockParticipant('22222222', 'used', 'School B'),
      createMockParticipant('33333333', 'unused', 'School C'),
    ];

    renderWithProviders(<CodeListTable codes={codes} contestId="contest-123" />);

    expect(screen.getByText('11111111')).toBeInTheDocument();
    expect(screen.getByText('22222222')).toBeInTheDocument();
    expect(screen.getByText('33333333')).toBeInTheDocument();
    expect(screen.getByText('School A')).toBeInTheDocument();
    expect(screen.getByText('School B')).toBeInTheDocument();
    expect(screen.getByText('School C')).toBeInTheDocument();
  });

  it('renders empty table when no codes provided', () => {
    const codes: Participant[] = [];

    renderWithProviders(<CodeListTable codes={codes} contestId="contest-123" />);

    // Table should exist with headers
    expect(screen.getByRole('table')).toBeInTheDocument();
    // But no data rows
    expect(screen.queryByText('12345678')).not.toBeInTheDocument();
  });
});
