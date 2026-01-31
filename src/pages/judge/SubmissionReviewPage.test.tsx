/**
 * SubmissionReviewPage Unit Tests - Story 5.2, Story 5.4
 * Tests anonymous submission review page with navigation, auto-save,
 * debounced feedback, rating validation, and Save & Next
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SubmissionReviewPage } from './SubmissionReviewPage';
import type { SubmissionForReview } from '@/features/reviews';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock auth
vi.mock('@/contexts', () => ({
  useAuth: () => ({
    user: { id: 'judge-1', email: 'judge@test.com', role: 'judge', firstName: null, lastName: null },
    isLoading: false,
    isAuthenticated: true,
  }),
}));

// Mock saveReview
const mockSaveReview = vi.fn().mockResolvedValue({});

// Mock submissions data
const mockSubmissions: SubmissionForReview[] = [
  {
    id: 'sub-1',
    mediaType: 'photo',
    mediaUrl: 'https://cdn.example.com/photo1.jpg',
    thumbnailUrl: null,
    bunnyVideoId: null,
    status: 'submitted',
    submittedAt: '2026-01-15T00:00:00Z',
    participantCode: 'ABC123',
    reviewId: null,
    rating: null,
    feedback: null,
  },
  {
    id: 'sub-2',
    mediaType: 'video',
    mediaUrl: 'https://iframe.mediadelivery.net/embed/lib-1/vid-1',
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    bunnyVideoId: 'vid-1',
    status: 'submitted',
    submittedAt: '2026-01-16T00:00:00Z',
    participantCode: 'DEF456',
    reviewId: 'rev-1',
    rating: 7,
    feedback: 'Good work',
  },
  {
    id: 'sub-3',
    mediaType: 'photo',
    mediaUrl: 'https://cdn.example.com/photo3.jpg',
    thumbnailUrl: null,
    bunnyVideoId: null,
    status: 'submitted',
    submittedAt: '2026-01-17T00:00:00Z',
    participantCode: 'GHI789',
    reviewId: null,
    rating: null,
    feedback: null,
  },
];

let mockSubmissionsData: SubmissionForReview[] | undefined = mockSubmissions;
let mockIsLoading = false;
let mockIsPending = false;

vi.mock('@/features/reviews', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/reviews')>();
  return {
    ...actual,
    useSubmissionsForReview: () => ({
      data: mockSubmissionsData,
      isLoading: mockIsLoading,
      error: null,
      progress: { total: 3, reviewed: 1, pending: 2, percentage: 33 },
    }),
    useUpsertReview: () => ({
      mutateAsync: mockSaveReview,
      isPending: mockIsPending,
    }),
  };
});

function renderPage(submissionId = 'sub-2', categoryId = 'cat-1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[`/judge/categories/${categoryId}/review/${submissionId}`]}
      >
        <Routes>
          <Route
            path="/judge/categories/:categoryId/review/:submissionId"
            element={<SubmissionReviewPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('SubmissionReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmissionsData = mockSubmissions;
    mockIsLoading = false;
    mockIsPending = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // --- Story 5.2 tests (preserved) ---

  // AC1: Anonymous display
  it('renders participant code, NOT name or PII', () => {
    renderPage();
    expect(screen.getByText('DEF456')).toBeInTheDocument();
  });

  // AC2: Shows "Submission X of Y" counter
  it('shows submission counter', () => {
    renderPage();
    expect(screen.getByText('Submission 2 of 3')).toBeInTheDocument();
  });

  // AC2: Displays MediaViewer
  it('displays MediaViewer with correct media type', () => {
    renderPage();
    const iframe = screen.getByTitle('Video submission by DEF456');
    expect(iframe).toBeInTheDocument();
  });

  // AC2: Shows RatingDisplay component
  it('shows RatingDisplay component with all tiers', () => {
    renderPage();
    expect(screen.getByText('Developing Skills')).toBeInTheDocument();
    expect(screen.getByText('Master Creator')).toBeInTheDocument();
  });

  // AC2: Shows feedback Textarea
  it('shows feedback textarea', () => {
    renderPage();
    const textarea = screen.getByPlaceholderText(
      'Provide constructive feedback for the participant... (optional)'
    );
    expect(textarea).toBeInTheDocument();
  });

  // AC2: Initializes from existing review data
  it('initializes rating and feedback from existing review', () => {
    renderPage('sub-2');
    const textarea = screen.getByPlaceholderText(
      'Provide constructive feedback for the participant... (optional)'
    );
    expect(textarea).toHaveValue('Good work');
  });

  // AC4: Previous button disabled on first submission
  it('Previous button disabled on first submission', () => {
    renderPage('sub-1');
    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  // AC5: Shows "You've reached the last submission" on last
  it('shows last submission message', () => {
    renderPage('sub-3');
    expect(screen.getByText("You've reached the last submission")).toBeInTheDocument();
  });

  // AC3: Clicking Previous navigates
  it('clicking Previous navigates to previous submission', async () => {
    const user = userEvent.setup();
    renderPage('sub-2');

    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);

    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1/review/sub-1');
  });

  // Back link navigates to category page
  it('back link navigates to category page', async () => {
    const user = userEvent.setup();
    renderPage();

    const backButton = screen.getByRole('button', { name: /back to category/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1');
  });

  // Loading skeleton shown while fetching
  it('loading skeleton shown while fetching', () => {
    mockIsLoading = true;
    renderPage();
    expect(screen.queryByText('DEF456')).not.toBeInTheDocument();
  });

  // Handles submission not found
  it('handles submission not found by redirecting', async () => {
    renderPage('non-existent-id');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1', { replace: true });
    });
  });

  // AC6: Left arrow navigates to previous submission
  it('left arrow navigates to previous submission', async () => {
    const user = userEvent.setup();
    renderPage('sub-2');

    await user.keyboard('{ArrowLeft}');

    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1/review/sub-1');
  });

  // AC6: Arrow keys ignored when textarea focused
  it('arrow keys ignored when textarea focused', async () => {
    const user = userEvent.setup();
    renderPage('sub-2');

    const textarea = screen.getByPlaceholderText(
      'Provide constructive feedback for the participant... (optional)'
    );
    await user.click(textarea);
    await user.keyboard('{ArrowRight}');

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // AC6: Arrow keys ignored on boundary
  it('left arrow ignored on first submission', async () => {
    const user = userEvent.setup();
    renderPage('sub-1');

    await user.keyboard('{ArrowLeft}');

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('right arrow ignored on last submission', async () => {
    const user = userEvent.setup();
    renderPage('sub-3');

    await user.keyboard('{ArrowRight}');

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // --- Story 5.4 tests ---

  // AC4: Feedback textarea has correct placeholder
  it('feedback textarea has correct placeholder text', () => {
    renderPage();
    const textarea = screen.getByPlaceholderText(
      'Provide constructive feedback for the participant... (optional)'
    );
    expect(textarea).toBeInTheDocument();
  });

  // AC5: Typing feedback and blurring triggers save
  it('typing feedback and blurring triggers save', async () => {
    const user = userEvent.setup();
    renderPage('sub-2'); // sub-2 has rating=7

    const textarea = screen.getByPlaceholderText(
      'Provide constructive feedback for the participant... (optional)'
    );

    await user.clear(textarea);
    await user.type(textarea, 'Great job');
    // blur via clicking outside
    await user.click(document.body);

    await waitFor(() => {
      expect(mockSaveReview).toHaveBeenCalledWith({
        submissionId: 'sub-2',
        rating: 7,
        feedback: 'Great job',
      });
    });
  });

  // AC5: "Saved" indicator appears after successful save
  it('"Saved" indicator appears after successful save', async () => {
    const user = userEvent.setup();
    renderPage('sub-2');

    const textarea = screen.getByPlaceholderText(
      'Provide constructive feedback for the participant... (optional)'
    );

    await user.clear(textarea);
    await user.type(textarea, 'Updated feedback');
    await user.click(document.body); // blur triggers save

    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  // AC5: "Saved" indicator fades after 2 seconds
  it('"Saved" indicator fades after 2 seconds', async () => {
    const user = userEvent.setup();
    renderPage('sub-2');

    const textarea = screen.getByPlaceholderText(
      'Provide constructive feedback for the participant... (optional)'
    );

    await user.clear(textarea);
    await user.type(textarea, 'New feedback');
    await user.click(document.body); // blur triggers save

    // Wait for save to resolve and "Saved" to appear
    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    // Wait for the 2000ms fade timer to fire (real timer)
    await waitFor(
      () => {
        expect(screen.queryByText('Saved')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  }, 10000);

  // AC7: Clicking Next without rating shows warning message
  it('clicking Next without rating shows warning message', async () => {
    const user = userEvent.setup();
    renderPage('sub-1'); // sub-1 has no rating

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(screen.getByText('Please select a rating before continuing')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // AC7: Warning clears when rating is selected
  it('warning clears when rating is selected', async () => {
    const user = userEvent.setup();
    renderPage('sub-1');

    // Trigger warning
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    expect(screen.getByText('Please select a rating before continuing')).toBeInTheDocument();

    // Select a rating to clear warning (triggers async save)
    await user.click(screen.getByText('Proficient Creator'));

    await waitFor(() => {
      expect(screen.queryByText('Please select a rating before continuing')).not.toBeInTheDocument();
    });
  });

  // AC6: Clicking "Save & Next" with rating saves and navigates
  it('clicking "Save & Next" with rating saves and navigates', async () => {
    const user = userEvent.setup();
    renderPage('sub-2'); // sub-2 has rating=7

    // sub-2 already has a rating, so "Save & Next" should be shown
    const saveNextButton = screen.getByRole('button', { name: /save & next/i });
    await user.click(saveNextButton);

    await waitFor(() => {
      // Should navigate (sub-3 is unreviewed, so it goes there)
      expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1/review/sub-3');
    });
  });

  // AC7: Previous button works without rating (no validation)
  it('Previous button works without rating (no warning)', async () => {
    const user = userEvent.setup();
    renderPage('sub-2');

    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);

    expect(screen.queryByText('Please select a rating before continuing')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1/review/sub-1');
  });

  // AC7: Keyboard ArrowRight without rating shows warning
  it('keyboard ArrowRight without rating shows warning', async () => {
    const user = userEvent.setup();
    renderPage('sub-1'); // no rating

    await user.keyboard('{ArrowRight}');

    expect(screen.getByText('Please select a rating before continuing')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // Rating change triggers immediate save
  it('rating change triggers immediate save', async () => {
    const user = userEvent.setup();
    renderPage('sub-1'); // no existing rating

    await user.click(screen.getByText('Advanced Producer'));

    await waitFor(() => {
      expect(mockSaveReview).toHaveBeenCalledWith({
        submissionId: 'sub-1',
        rating: 7,
        feedback: '',
      });
    });
  });

  // Debounced feedback auto-save fires after 1.5 seconds
  it('debounced feedback auto-save fires after 1500ms', async () => {
    const user = userEvent.setup();
    renderPage('sub-2');

    const textarea = screen.getByPlaceholderText(
      'Provide constructive feedback for the participant... (optional)'
    );

    await user.clear(textarea);
    await user.type(textarea, 'Test');

    // Not yet saved (still within debounce)
    expect(mockSaveReview).not.toHaveBeenCalled();

    // Wait for the 1500ms debounce to fire (real timer)
    await waitFor(
      () => {
        expect(mockSaveReview).toHaveBeenCalledWith({
          submissionId: 'sub-2',
          rating: 7,
          feedback: 'Test',
        });
      },
      { timeout: 3000 },
    );
  }, 10000);

  // "Save & Next" button shows when rating is set, "Next" when no rating
  it('shows "Save & Next" when rating is set, "Next" when no rating', async () => {
    const user = userEvent.setup();
    renderPage('sub-1'); // no rating

    // Should show plain "Next"
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save & next/i })).not.toBeInTheDocument();

    // Select a rating (triggers async save)
    await user.click(screen.getByText('Proficient Creator'));

    // Should now show "Save & Next"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save & next/i })).toBeInTheDocument();
    });
  });

  // Does not auto-save if nothing is dirty
  it('does not auto-save if nothing is dirty', async () => {
    const user = userEvent.setup();
    renderPage('sub-2');

    const textarea = screen.getByPlaceholderText(
      'Provide constructive feedback for the participant... (optional)'
    );

    // Focus and blur without changing
    await user.click(textarea);
    await user.click(document.body);

    // Wait a bit to make sure no save fires
    await new Promise((r) => setTimeout(r, 100));
    expect(mockSaveReview).not.toHaveBeenCalled();
  });
});
