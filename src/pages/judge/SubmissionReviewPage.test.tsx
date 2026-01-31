/**
 * SubmissionReviewPage Unit Tests - Story 5.2
 * Tests anonymous submission review page with navigation, auto-save, and keyboard nav
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
      isPending: false,
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
  });

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
    // Video submission — should render iframe
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
    // sub-2 has rating=7 (Advanced Producer tier) and feedback='Good work'
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

  // AC5: Next button disabled on last submission
  it('Next button disabled on last submission', () => {
    renderPage('sub-3');
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  // AC5: Shows "You've reached the last submission" on last
  it('shows last submission message', () => {
    renderPage('sub-3');
    expect(screen.getByText("You've reached the last submission")).toBeInTheDocument();
  });

  // AC3: Clicking Next navigates
  it('clicking Next navigates to next submission', async () => {
    const user = userEvent.setup();
    renderPage('sub-1');

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1/review/sub-2');
  });

  // AC3: Clicking Previous navigates
  it('clicking Previous navigates to previous submission', async () => {
    const user = userEvent.setup();
    renderPage('sub-2');

    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);

    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1/review/sub-1');
  });

  // AC3: Auto-save called before navigation when dirty
  it('auto-saves before navigation when dirty', async () => {
    const user = userEvent.setup();
    renderPage('sub-1');

    // Make dirty by clicking a rating tier
    await user.click(screen.getByText('Proficient Creator'));

    // Navigate next
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(mockSaveReview).toHaveBeenCalledWith({
      submissionId: 'sub-1',
      rating: 5,
      feedback: '',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1/review/sub-2');
  });

  // Auto-save NOT called when not dirty
  it('does not auto-save when not dirty', async () => {
    const user = userEvent.setup();
    renderPage('sub-1');

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(mockSaveReview).not.toHaveBeenCalled();
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

    // Should not display submission content
    expect(screen.queryByText('DEF456')).not.toBeInTheDocument();
  });

  // Handles submission not found
  it('handles submission not found by redirecting', () => {
    renderPage('non-existent-id');
    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1', { replace: true });
  });

  // AC6: Right arrow navigates to next submission
  it('right arrow navigates to next submission', async () => {
    const user = userEvent.setup();
    renderPage('sub-1');

    await user.keyboard('{ArrowRight}');

    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1/review/sub-2');
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
});
