/**
 * RankingSlot Unit Tests - Story 5.5 (AC2, AC3, AC4, AC6)
 * Tests droppable ranking position slot
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RankingSlot } from './RankingSlot';
import type { SubmissionForReview } from '../types/review.types';

// Mock @dnd-kit/core
const mockIsOver = vi.fn(() => false);
vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: mockIsOver(),
  }),
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
  rating: 9,
  feedback: 'Excellent',
};

describe('RankingSlot', () => {
  it('renders position label and drop text when empty', () => {
    render(
      <RankingSlot position={1} submission={null} onRemove={vi.fn()} />
    );
    expect(screen.getByText('1st Place')).toBeInTheDocument();
    expect(screen.getByText('Drop submission here')).toBeInTheDocument();
  });

  it('renders 2nd place label correctly', () => {
    render(
      <RankingSlot position={2} submission={null} onRemove={vi.fn()} />
    );
    expect(screen.getByText('2nd Place')).toBeInTheDocument();
  });

  it('renders 3rd place label correctly', () => {
    render(
      <RankingSlot position={3} submission={null} onRemove={vi.fn()} />
    );
    expect(screen.getByText('3rd Place')).toBeInTheDocument();
  });

  it('shows submission info when filled', () => {
    render(
      <RankingSlot position={1} submission={baseSubmission} onRemove={vi.fn()} />
    );
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText(/Master Creator/)).toBeInTheDocument();
    expect(screen.queryByText('Drop submission here')).not.toBeInTheDocument();
  });

  it('shows thumbnail for filled slot', () => {
    render(
      <RankingSlot position={1} submission={baseSubmission} onRemove={vi.fn()} />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/photo.jpg');
  });

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <RankingSlot position={1} submission={baseSubmission} onRemove={onRemove} />
    );

    const removeBtn = screen.getByRole('button', { name: /Remove from rank 1/i });
    await user.click(removeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('applies highlight styles when isOver is true', () => {
    mockIsOver.mockReturnValue(true);
    render(
      <RankingSlot position={1} submission={null} onRemove={vi.fn()} />
    );

    const slot = screen.getByRole('group');
    expect(slot.className).toContain('border-primary');
    mockIsOver.mockReturnValue(false);
  });

  it('has correct ARIA attributes', () => {
    render(
      <RankingSlot position={1} submission={null} onRemove={vi.fn()} />
    );
    const slot = screen.getByRole('group');
    expect(slot).toHaveAttribute('aria-label', 'Rank 1 position');
  });
});
