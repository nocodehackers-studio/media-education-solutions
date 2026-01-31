/**
 * RatingDisplay Unit Tests - Story 5.2 (AC2), Story 5.4 (AC1, AC2, AC3)
 * Tests tier-selection and granular score selection for judge review
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingDisplay } from './RatingDisplay';

describe('RatingDisplay', () => {
  // --- Story 5.2 tests (preserved) ---

  it('renders all 5 tier options', () => {
    render(<RatingDisplay value={null} onChange={vi.fn()} />);

    expect(screen.getByText('Developing Skills')).toBeInTheDocument();
    expect(screen.getByText('Emerging Producer')).toBeInTheDocument();
    expect(screen.getByText('Proficient Creator')).toBeInTheDocument();
    expect(screen.getByText('Advanced Producer')).toBeInTheDocument();
    expect(screen.getByText('Master Creator')).toBeInTheDocument();
  });

  it('shows score ranges for each tier', () => {
    render(<RatingDisplay value={null} onChange={vi.fn()} />);

    expect(screen.getByText('1–2')).toBeInTheDocument();
    expect(screen.getByText('3–4')).toBeInTheDocument();
    expect(screen.getByText('5–6')).toBeInTheDocument();
    expect(screen.getByText('7–8')).toBeInTheDocument();
    expect(screen.getByText('9–10')).toBeInTheDocument();
  });

  it('highlights selected tier', () => {
    render(<RatingDisplay value={7} onChange={vi.fn()} />);

    const radiogroup = screen.getByRole('radiogroup', { name: 'Rating' });
    const tierButtons = within(radiogroup).getAllByRole('radio');
    // Tier 4 (Advanced Producer, 7-8) should be selected — index 3
    expect(tierButtons[3]).toHaveAttribute('aria-checked', 'true');
    expect(tierButtons[3].className).toContain('border-primary');
    expect(tierButtons[3].className).toContain('bg-primary/10');
  });

  it('no tier highlighted when value is null', () => {
    render(<RatingDisplay value={null} onChange={vi.fn()} />);

    const radiogroup = screen.getByRole('radiogroup', { name: 'Rating' });
    const tierButtons = within(radiogroup).getAllByRole('radio');
    tierButtons.forEach((button) => {
      expect(button).toHaveAttribute('aria-checked', 'false');
      expect(button.className).not.toContain('bg-primary/10');
    });
  });

  it('calls onChange with tier lower bound on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RatingDisplay value={null} onChange={onChange} />);

    await user.click(screen.getByText('Advanced Producer'));
    expect(onChange).toHaveBeenCalledWith(7);

    await user.click(screen.getByText('Developing Skills'));
    expect(onChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByText('Master Creator'));
    expect(onChange).toHaveBeenCalledWith(9);
  });

  // --- Story 5.4 tests ---

  it('clicking a tier shows granular score buttons for that tier', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<RatingDisplay value={null} onChange={onChange} />);

    // No score buttons initially
    expect(screen.queryByLabelText('Score 7')).not.toBeInTheDocument();

    // Simulate tier selection (parent would call onChange, then pass new value)
    rerender(<RatingDisplay value={7} onChange={onChange} />);

    // Score buttons for tier 4 (7-8) should appear
    expect(screen.getByLabelText('Score 7')).toBeInTheDocument();
    expect(screen.getByLabelText('Score 8')).toBeInTheDocument();
  });

  it('score buttons show correct numbers for each tier', () => {
    const onChange = vi.fn();

    // Tier 1: Developing Skills (1-2)
    const { rerender } = render(<RatingDisplay value={1} onChange={onChange} />);
    expect(screen.getByLabelText('Score 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Score 2')).toBeInTheDocument();
    expect(screen.queryByLabelText('Score 3')).not.toBeInTheDocument();

    // Tier 3: Proficient Creator (5-6)
    rerender(<RatingDisplay value={5} onChange={onChange} />);
    expect(screen.getByLabelText('Score 5')).toBeInTheDocument();
    expect(screen.getByLabelText('Score 6')).toBeInTheDocument();
    expect(screen.queryByLabelText('Score 4')).not.toBeInTheDocument();

    // Tier 5: Master Creator (9-10)
    rerender(<RatingDisplay value={9} onChange={onChange} />);
    expect(screen.getByLabelText('Score 9')).toBeInTheDocument();
    expect(screen.getByLabelText('Score 10')).toBeInTheDocument();
    expect(screen.queryByLabelText('Score 8')).not.toBeInTheDocument();
  });

  it('clicking a score button calls onChange with exact score', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RatingDisplay value={7} onChange={onChange} />);

    await user.click(screen.getByLabelText('Score 8'));
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it('selected score button has visual distinction', () => {
    render(<RatingDisplay value={8} onChange={vi.fn()} />);

    const score8 = screen.getByLabelText('Score 8');
    const score7 = screen.getByLabelText('Score 7');

    // Selected score (8) should have aria-checked true
    expect(score8).toHaveAttribute('aria-checked', 'true');
    expect(score7).toHaveAttribute('aria-checked', 'false');
  });

  it('switching tier shows new score range', () => {
    const onChange = vi.fn();
    const { rerender } = render(<RatingDisplay value={7} onChange={onChange} />);

    // Tier 4: shows 7, 8
    expect(screen.getByLabelText('Score 7')).toBeInTheDocument();
    expect(screen.getByLabelText('Score 8')).toBeInTheDocument();

    // Switch to tier 2: shows 3, 4
    rerender(<RatingDisplay value={3} onChange={onChange} />);
    expect(screen.getByLabelText('Score 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Score 4')).toBeInTheDocument();
    expect(screen.queryByLabelText('Score 7')).not.toBeInTheDocument();
  });

  it('when value=8, tier "Advanced Producer" is highlighted AND score "8" is highlighted', () => {
    render(<RatingDisplay value={8} onChange={vi.fn()} />);

    // Tier button checked
    const radiogroup = screen.getByRole('radiogroup', { name: 'Rating' });
    const tierButtons = within(radiogroup).getAllByRole('radio');
    expect(tierButtons[3]).toHaveAttribute('aria-checked', 'true'); // Advanced Producer

    // Score button checked
    expect(screen.getByLabelText('Score 8')).toHaveAttribute('aria-checked', 'true');
  });

  it('when value is null, no tier or score is highlighted', () => {
    render(<RatingDisplay value={null} onChange={vi.fn()} />);

    const radiogroup = screen.getByRole('radiogroup', { name: 'Rating' });
    const tierButtons = within(radiogroup).getAllByRole('radio');
    tierButtons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-checked', 'false');
    });

    // No score buttons should exist
    expect(screen.queryByLabelText(/^Score \d+$/)).not.toBeInTheDocument();
  });

  it('has ARIA radiogroup with aria-label="Rating"', () => {
    render(<RatingDisplay value={null} onChange={vi.fn()} />);

    const radiogroup = screen.getByRole('radiogroup', { name: 'Rating' });
    expect(radiogroup).toBeInTheDocument();
  });

  it('granular score buttons are wrapped in a radiogroup', () => {
    render(<RatingDisplay value={7} onChange={vi.fn()} />);

    const scoreGroup = screen.getByRole('radiogroup', { name: 'Granular score' });
    expect(scoreGroup).toBeInTheDocument();
    expect(within(scoreGroup).getByLabelText('Score 7')).toBeInTheDocument();
    expect(within(scoreGroup).getByLabelText('Score 8')).toBeInTheDocument();
  });

  it('tier buttons have role="radio" and aria-checked', () => {
    render(<RatingDisplay value={5} onChange={vi.fn()} />);

    const radiogroup = screen.getByRole('radiogroup', { name: 'Rating' });
    const tierButtons = within(radiogroup).getAllByRole('radio');
    expect(tierButtons).toHaveLength(5);

    // Proficient Creator (tier 3) should be checked
    expect(tierButtons[2]).toHaveAttribute('aria-checked', 'true');
    // Others not checked
    expect(tierButtons[0]).toHaveAttribute('aria-checked', 'false');
    expect(tierButtons[1]).toHaveAttribute('aria-checked', 'false');
    expect(tierButtons[3]).toHaveAttribute('aria-checked', 'false');
    expect(tierButtons[4]).toHaveAttribute('aria-checked', 'false');
  });

  it('keyboard focus works on tier and score buttons', async () => {
    const user = userEvent.setup();
    render(<RatingDisplay value={7} onChange={vi.fn()} />);

    // Tab to first tier button
    await user.tab();
    const radiogroup = screen.getByRole('radiogroup', { name: 'Rating' });
    const firstTierButton = within(radiogroup).getAllByRole('radio')[0];
    expect(firstTierButton).toHaveFocus();

    // Tab through all tier buttons to score buttons
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();

    // Now should be on score buttons
    await user.tab();
    const score7 = screen.getByLabelText('Score 7');
    expect(score7).toHaveFocus();
  });
});
