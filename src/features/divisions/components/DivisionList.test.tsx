// DivisionList Component Tests - Story 2.9
// Tests rendering, loading, error, and user interactions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { DivisionList } from './DivisionList';
import { divisionsApi } from '../api/divisionsApi';
import type { Division } from '../types/division.types';

// Mock the API
vi.mock('../api/divisionsApi', () => ({
  divisionsApi: {
    listByContest: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getCount: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui')>();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const mockDivisions: Division[] = [
  {
    id: 'div-1',
    contestId: 'contest-1',
    name: 'High School',
    displayOrder: 0,
    createdAt: '2026-01-21T00:00:00Z',
    categoryCount: 3,
  },
  {
    id: 'div-2',
    contestId: 'contest-1',
    name: 'Teachers',
    displayOrder: 1,
    createdAt: '2026-01-21T00:00:00Z',
    categoryCount: 5,
  },
];

describe('DivisionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading skeleton while fetching', () => {
      vi.mocked(divisionsApi.listByContest).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<DivisionList contestId="contest-1" />);

      expect(screen.getByText('Divisions')).toBeInTheDocument();
      // Skeleton elements should be present
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error state', () => {
    it('shows error message when fetch fails', async () => {
      vi.mocked(divisionsApi.listByContest).mockRejectedValue(
        new Error('Failed to load')
      );

      renderWithProviders(<DivisionList contestId="contest-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load divisions/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no divisions exist', async () => {
      vi.mocked(divisionsApi.listByContest).mockResolvedValue([]);

      renderWithProviders(<DivisionList contestId="contest-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(/no divisions yet/i)
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: /create first division/i })
      ).toBeInTheDocument();
    });
  });

  describe('Divisions display (AC2)', () => {
    it('renders list of divisions with name and category count', async () => {
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(mockDivisions);

      renderWithProviders(<DivisionList contestId="contest-1" />);

      await waitFor(() => {
        expect(screen.getByText('High School')).toBeInTheDocument();
      });

      expect(screen.getByText('Teachers')).toBeInTheDocument();
      expect(screen.getByText('3 categories')).toBeInTheDocument();
      expect(screen.getByText('5 categories')).toBeInTheDocument();
    });

    it('shows display order for each division', async () => {
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(mockDivisions);

      renderWithProviders(<DivisionList contestId="contest-1" />);

      await waitFor(() => {
        expect(screen.getByText('Order: 0')).toBeInTheDocument();
      });

      expect(screen.getByText('Order: 1')).toBeInTheDocument();
    });

    it('uses singular "category" when count is 1', async () => {
      const singleCategoryDivision: Division[] = [
        {
          ...mockDivisions[0],
          categoryCount: 1,
        },
      ];

      vi.mocked(divisionsApi.listByContest).mockResolvedValue(
        singleCategoryDivision
      );

      renderWithProviders(<DivisionList contestId="contest-1" />);

      await waitFor(() => {
        expect(screen.getByText('1 category')).toBeInTheDocument();
      });
    });
  });

  describe('Add Division button (AC3)', () => {
    it('shows Add Division button in header', async () => {
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(mockDivisions);

      renderWithProviders(<DivisionList contestId="contest-1" />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /add division/i })
        ).toBeInTheDocument();
      });
    });

    it('opens CreateDivisionSheet when Add Division is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(mockDivisions);
      vi.mocked(divisionsApi.create).mockResolvedValue(mockDivisions[0]);

      renderWithProviders(<DivisionList contestId="contest-1" />);

      await waitFor(() => {
        expect(screen.getByText('High School')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add division/i });
      await user.click(addButton);

      // Sheet content should appear - look for the input field which is more reliable
      await waitFor(() => {
        expect(screen.getByLabelText(/division name/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit/Delete actions', () => {
    it('shows edit button for each division', async () => {
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(mockDivisions);

      renderWithProviders(<DivisionList contestId="contest-1" />);

      await waitFor(() => {
        expect(screen.getByText('High School')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit division/i });
      expect(editButtons).toHaveLength(2);
    });

    it('shows delete button for each division when multiple exist', async () => {
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(mockDivisions);

      renderWithProviders(<DivisionList contestId="contest-1" />);

      await waitFor(() => {
        expect(screen.getByText('High School')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete division/i });
      expect(deleteButtons).toHaveLength(2);
      // Both should be enabled when there are multiple divisions
      deleteButtons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it('shows delete button enabled for only division (AC5)', async () => {
      const singleDivision: Division[] = [mockDivisions[0]];
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(singleDivision);

      renderWithProviders(<DivisionList contestId="contest-1" />);

      await waitFor(() => {
        expect(screen.getByText('High School')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete division/i });
      // Button should be enabled even for only division (so user can click and see error toast)
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe('Card structure', () => {
    it('renders with proper card header and description', async () => {
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(mockDivisions);

      renderWithProviders(<DivisionList contestId="contest-1" />);

      // Wait for data to load (divisions to appear)
      await waitFor(() => {
        expect(screen.getByText('High School')).toBeInTheDocument();
      });

      // Now check header elements
      expect(screen.getByText('Divisions')).toBeInTheDocument();
      expect(
        screen.getByText(/organize categories by competition level/i)
      ).toBeInTheDocument();
    });
  });
});
