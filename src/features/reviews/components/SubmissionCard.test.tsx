/**
 * SubmissionCard Unit Tests - Story 5.1 (AC3)
 * Tests submission card display for judge review dashboard
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { SubmissionCard } from './SubmissionCard';
import type { SubmissionForReview } from '../types/review.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function Wrapper({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

const baseSubmission: SubmissionForReview = {
  id: 'sub-1',
  mediaType: 'photo',
  mediaUrl: 'https://cdn.example.com/photo.jpg',
  thumbnailUrl: null,
  bunnyVideoId: null,
  status: 'submitted',
  submittedAt: '2026-01-15T00:00:00Z',
  participantCode: 'ABC123',
  reviewId: null,
  rating: null,
  feedback: null,
};

const testCategoryId = 'cat-1';

describe('SubmissionCard', () => {
  it('renders participant code prominently', () => {
    render(<SubmissionCard submission={baseSubmission} categoryId={testCategoryId} />, { wrapper: Wrapper });
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('shows thumbnail for photo submission', () => {
    render(<SubmissionCard submission={baseSubmission} categoryId={testCategoryId} />, { wrapper: Wrapper });
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/photo.jpg');
  });

  it('shows thumbnail for video submission using thumbnailUrl', () => {
    const videoSubmission: SubmissionForReview = {
      ...baseSubmission,
      mediaType: 'video',
      mediaUrl: null,
      thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
      bunnyVideoId: 'vid-123',
    };
    render(<SubmissionCard submission={videoSubmission} categoryId={testCategoryId} />, { wrapper: Wrapper });
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/thumb.jpg');
  });

  it('shows placeholder when thumbnailUrl is null for video', () => {
    const videoSubmission: SubmissionForReview = {
      ...baseSubmission,
      mediaType: 'video',
      mediaUrl: null,
      thumbnailUrl: null,
      bunnyVideoId: 'vid-123',
    };
    render(<SubmissionCard submission={videoSubmission} categoryId={testCategoryId} />, { wrapper: Wrapper });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows "Pending" badge when no review', () => {
    render(<SubmissionCard submission={baseSubmission} categoryId={testCategoryId} />, { wrapper: Wrapper });
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows "Reviewed" badge with tier when review exists', () => {
    const reviewedSubmission: SubmissionForReview = {
      ...baseSubmission,
      reviewId: 'rev-1',
      rating: 8,
      feedback: 'Great work',
    };
    render(<SubmissionCard submission={reviewedSubmission} categoryId={testCategoryId} />, { wrapper: Wrapper });
    expect(screen.getByText('Reviewed')).toBeInTheDocument();
    expect(screen.getByText(/Advanced Producer/)).toBeInTheDocument();
  });

  it('navigates to category review route on click', async () => {
    const user = userEvent.setup();
    render(<SubmissionCard submission={baseSubmission} categoryId={testCategoryId} />, { wrapper: Wrapper });

    const card = screen.getByRole('button');
    await user.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1/review/sub-1');
  });
});
