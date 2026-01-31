/**
 * RatingDisplay Unit Tests - Story 5.2 (AC2)
 * Tests tier-selection rating component for judge review
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingDisplay } from './RatingDisplay';

describe('RatingDisplay', () => {
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
    const { container } = render(<RatingDisplay value={7} onChange={vi.fn()} />);

    const buttons = container.querySelectorAll('button');
    // Tier 4 (Advanced Producer, 7-8) should be selected
    const advancedButton = buttons[3]; // 0-indexed, tier 4 is index 3
    expect(advancedButton.className).toContain('border-primary');
    expect(advancedButton.className).toContain('bg-primary/10');
  });

  it('no tier highlighted when value is null', () => {
    const { container } = render(<RatingDisplay value={null} onChange={vi.fn()} />);

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
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
});
