/**
 * DraggableSubmissionCard Unit Tests - Story 5.5 (AC2, AC3)
 * Tests draggable submission card for ranking pool
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DraggableSubmissionCard } from './DraggableSubmissionCard';
import type { SubmissionForReview } from '../types/review.types';

// Mock @dnd-kit
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: { role: 'button', tabIndex: 0 },
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Translate: { toString: () => '' } },
}));

const baseSubmission: SubmissionForReview = {
  id: 'sub-1',
  mediaType: 'photo',
  mediaUrl: 'https://cdn.example.com/photo.jpg',
  thumbnailUrl: null,
  bunnyVideoId: null,
  status: 'submitted',
  submittedAt: '2026-01-15T00:00:00Z',
  participantCode: 'ABC123',
  reviewId: 'rev-1',
  rating: 8,
  feedback: 'Great work',
};

describe('DraggableSubmissionCard', () => {
  it('renders participant code', () => {
    render(
      <DraggableSubmissionCard submission={baseSubmission} isRanked={false} />
    );
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('renders rating tier and score', () => {
    render(
      <DraggableSubmissionCard submission={baseSubmission} isRanked={false} />
    );
    expect(screen.getByText(/Advanced Producer/)).toBeInTheDocument();
    expect(screen.getByText(/8/)).toBeInTheDocument();
  });

  it('shows "Ranked" badge when isRanked is true', () => {
    render(
      <DraggableSubmissionCard submission={baseSubmission} isRanked={true} />
    );
    expect(screen.getByText('Ranked')).toBeInTheDocument();
  });

  it('does not show "Ranked" badge when isRanked is false', () => {
    render(
      <DraggableSubmissionCard submission={baseSubmission} isRanked={false} />
    );
    expect(screen.queryByText('Ranked')).not.toBeInTheDocument();
  });

  it('applies dimmed styles when ranked', () => {
    const { container } = render(
      <DraggableSubmissionCard submission={baseSubmission} isRanked={true} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('opacity-50');
  });

  it('shows thumbnail for photo submission', () => {
    render(
      <DraggableSubmissionCard submission={baseSubmission} isRanked={false} />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/photo.jpg');
  });

  it('has correct ARIA attributes', () => {
    render(
      <DraggableSubmissionCard submission={baseSubmission} isRanked={false} />
    );
    const card = screen.getByRole('option');
    expect(card).toHaveAttribute('aria-roledescription', 'draggable submission');
  });
});
