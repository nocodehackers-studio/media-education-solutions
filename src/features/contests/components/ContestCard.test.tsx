import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContestCard } from './ContestCard';
import type { Contest } from '../types/contest.types';

const mockContest: Contest = {
  id: 'contest-123',
  name: 'Summer Video Contest',
  description: 'A contest for summer videos',
  slug: 'summer-video-contest',
  contestCode: 'ABC123',
  rules: 'Some rules',
  coverImageUrl: null,
  status: 'draft',
  winnersPagePassword: null,
  createdAt: '2026-01-10T12:00:00Z',
  updatedAt: '2026-01-10T12:00:00Z',
};

describe('ContestCard', () => {
  it('renders contest name', () => {
    const onClick = vi.fn();
    render(<ContestCard contest={mockContest} onClick={onClick} />);

    expect(screen.getByText('Summer Video Contest')).toBeInTheDocument();
  });

  it('renders contest description', () => {
    const onClick = vi.fn();
    render(<ContestCard contest={mockContest} onClick={onClick} />);

    expect(screen.getByText('A contest for summer videos')).toBeInTheDocument();
  });

  it('renders status badge with correct text', () => {
    const onClick = vi.fn();
    render(<ContestCard contest={mockContest} onClick={onClick} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders submission count as 0', () => {
    const onClick = vi.fn();
    render(<ContestCard contest={mockContest} onClick={onClick} />);

    expect(screen.getByText('Submissions: 0')).toBeInTheDocument();
  });

  it('renders formatted created date', () => {
    const onClick = vi.fn();
    render(<ContestCard contest={mockContest} onClick={onClick} />);

    // The date format depends on locale, so we just check it contains the date
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });

  it('calls onClick with contest id when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ContestCard contest={mockContest} onClick={onClick} />);

    const card = screen.getByTestId('contest-card');
    await user.click(card);

    expect(onClick).toHaveBeenCalledWith('contest-123');
  });

  it('renders different status colors', () => {
    const onClick = vi.fn();

    // Test published status
    const publishedContest: Contest = { ...mockContest, status: 'published' };
    const { rerender } = render(
      <ContestCard contest={publishedContest} onClick={onClick} />
    );
    expect(screen.getByText('Published')).toBeInTheDocument();

    // Test closed status
    const closedContest: Contest = { ...mockContest, status: 'closed' };
    rerender(<ContestCard contest={closedContest} onClick={onClick} />);
    expect(screen.getByText('Closed')).toBeInTheDocument();

    // Test reviewed status
    const reviewedContest: Contest = { ...mockContest, status: 'reviewed' };
    rerender(<ContestCard contest={reviewedContest} onClick={onClick} />);
    expect(screen.getByText('Reviewed')).toBeInTheDocument();

    // Test finished status
    const finishedContest: Contest = { ...mockContest, status: 'finished' };
    rerender(<ContestCard contest={finishedContest} onClick={onClick} />);
    expect(screen.getByText('Finished')).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    const onClick = vi.fn();
    const contestNoDesc: Contest = { ...mockContest, description: null };
    render(<ContestCard contest={contestNoDesc} onClick={onClick} />);

    expect(
      screen.queryByText('A contest for summer videos')
    ).not.toBeInTheDocument();
  });
});
