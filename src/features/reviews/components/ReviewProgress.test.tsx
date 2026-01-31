/**
 * ReviewProgress Unit Tests - Story 5.1 (AC2)
 * Tests progress bar display for judge review dashboard
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewProgress } from './ReviewProgress';
import type { ReviewProgress as ReviewProgressType } from '../types/review.types';

describe('ReviewProgress', () => {
  it('shows "0 of 5 reviewed" for no reviews', () => {
    const progress: ReviewProgressType = {
      total: 5,
      reviewed: 0,
      pending: 5,
      percentage: 0,
    };
    render(<ReviewProgress progress={progress} />);
    expect(screen.getByText('0 of 5 reviewed')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows "3 of 5 reviewed" with correct percentage', () => {
    const progress: ReviewProgressType = {
      total: 5,
      reviewed: 3,
      pending: 2,
      percentage: 60,
    };
    render(<ReviewProgress progress={progress} />);
    expect(screen.getByText('3 of 5 reviewed')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows "5 of 5 reviewed" for complete', () => {
    const progress: ReviewProgressType = {
      total: 5,
      reviewed: 5,
      pending: 0,
      percentage: 100,
    };
    render(<ReviewProgress progress={progress} />);
    expect(screen.getByText('5 of 5 reviewed')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders the progress bar', () => {
    const progress: ReviewProgressType = {
      total: 10,
      reviewed: 5,
      pending: 5,
      percentage: 50,
    };
    render(<ReviewProgress progress={progress} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });
});
