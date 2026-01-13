import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditCategoryForm } from './EditCategoryForm';
import * as categoriesApi from '../api/categoriesApi';
import { toast } from '@/components/ui';
import type { Category } from '../types/category.types';
import type { ReactElement } from 'react';

// Mock the API
vi.mock('../api/categoriesApi', () => ({
  categoriesApi: {
    listByContest: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    getSubmissionCount: vi.fn(),
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

const mockCategory: Category = {
  id: 'cat-1',
  contestId: 'contest-123',
  name: 'Best Video',
  type: 'video',
  rules: 'Some rules',
  description: 'Best video category',
  deadline: new Date('2026-12-31').toISOString(),
  status: 'draft',
  createdAt: new Date().toISOString(),
};

describe('EditCategoryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with pre-populated fields', () => {
    renderWithProviders(
      <EditCategoryForm category={mockCategory} contestId="contest-123" />
    );

    expect(screen.getByLabelText(/category name/i)).toHaveValue('Best Video');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Best video category');
    expect(screen.getByLabelText(/category rules/i)).toHaveValue('Some rules');
  });

  it('renders all form fields', () => {
    renderWithProviders(
      <EditCategoryForm category={mockCategory} contestId="contest-123" />
    );

    expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/submission type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/submission deadline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category rules/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('shows validation error when name is cleared', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EditCategoryForm category={mockCategory} contestId="contest-123" />
    );

    const nameInput = screen.getByLabelText(/category name/i);
    await user.clear(nameInput);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/category name is required/i)).toBeInTheDocument();
    });
  });

  it('calls update API with changed values', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    vi.mocked(categoriesApi.categoriesApi.update).mockResolvedValue({
      ...mockCategory,
      name: 'Updated Name',
    });

    renderWithProviders(
      <EditCategoryForm
        category={mockCategory}
        contestId="contest-123"
        onSuccess={onSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/category name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(categoriesApi.categoriesApi.update).toHaveBeenCalledWith(
        'cat-1',
        expect.objectContaining({
          name: 'Updated Name',
        })
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Category updated');
    });
  });

  it('shows error toast on update failure', async () => {
    const user = userEvent.setup();
    vi.mocked(categoriesApi.categoriesApi.update).mockRejectedValue(
      new Error('Failed to update category')
    );

    renderWithProviders(
      <EditCategoryForm category={mockCategory} contestId="contest-123" />
    );

    const nameInput = screen.getByLabelText(/category name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update category');
    });
  });

  it('renders type dropdown with current type selected', () => {
    renderWithProviders(
      <EditCategoryForm category={mockCategory} contestId="contest-123" />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles category with null description and rules', () => {
    const categoryWithNulls: Category = {
      ...mockCategory,
      description: null,
      rules: null,
    };

    renderWithProviders(
      <EditCategoryForm category={categoryWithNulls} contestId="contest-123" />
    );

    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/category rules/i)).toHaveValue('');
  });
});
