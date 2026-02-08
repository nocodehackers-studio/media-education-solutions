import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { DeadlineCountdown } from './DeadlineCountdown';

// Fixed base time for deterministic tests
const BASE_TIME = new Date('2026-06-15T12:00:00Z').getTime();

function deadlineFromNow(seconds: number): string {
  return new Date(BASE_TIME + seconds * 1000).toISOString();
}

describe('DeadlineCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const getCountdownInner = (container: HTMLElement) =>
    container.querySelector('[class*="flex items-center"]') as HTMLElement;

  describe('adaptive format ranges', () => {
    it('shows formatted date only when >24h remaining', () => {
      const deadline = deadlineFromNow(86401); // 24h + 1s
      render(<DeadlineCountdown deadline={deadline} timezone="America/New_York" />);

      // Should NOT show countdown format
      expect(screen.queryByText(/\d+h/)).not.toBeInTheDocument();
      expect(screen.queryByText(/\d+m/)).not.toBeInTheDocument();
      expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument();
      // Should show formatted date (86401s from noon UTC = next day in ET)
      expect(screen.getByText(/Jun/)).toBeInTheDocument();
    });

    it('shows countdown at exactly 24h (boundary)', () => {
      const deadline = deadlineFromNow(86400); // exactly 24h
      render(<DeadlineCountdown deadline={deadline} timezone="America/New_York" />);

      expect(screen.getByText('24h 0m 0s')).toBeInTheDocument();
    });

    it('shows "Xh Ym Zs" format for 3h remaining', () => {
      const deadline = deadlineFromNow(3 * 3600); // 3h
      const { container } = render(
        <DeadlineCountdown deadline={deadline} timezone="America/New_York" />
      );

      expect(screen.getByText('3h 0m 0s')).toBeInTheDocument();
      const inner = getCountdownInner(container);
      expect(inner.className).toContain('text-muted-foreground');
    });

    it('shows "Xh Ym Zs" with warning styling for 1h 30m remaining', () => {
      const deadline = deadlineFromNow(90 * 60); // 1h 30m
      const { container } = render(
        <DeadlineCountdown deadline={deadline} timezone="America/New_York" />
      );

      expect(screen.getByText('1h 30m 0s')).toBeInTheDocument();
      const inner = getCountdownInner(container);
      expect(inner.className).toContain('text-amber-600');
    });

    it('shows "Ym Zs" format for 45m 20s remaining', () => {
      const deadline = deadlineFromNow(45 * 60 + 20); // 45m 20s
      render(<DeadlineCountdown deadline={deadline} timezone="America/New_York" />);

      expect(screen.getByText('45m 20s')).toBeInTheDocument();
    });

    it('shows "Ym Zs" with urgent styling for 5m remaining', () => {
      const deadline = deadlineFromNow(5 * 60); // 5m
      const { container } = render(
        <DeadlineCountdown deadline={deadline} timezone="America/New_York" />
      );

      expect(screen.getByText('5m 0s')).toBeInTheDocument();
      const inner = getCountdownInner(container);
      expect(inner.className).toContain('text-red-600');
      expect(inner.className).toContain('motion-safe:animate-pulse');
    });

    it('shows "Zs" format for 30s remaining', () => {
      const deadline = deadlineFromNow(30); // 30s
      render(<DeadlineCountdown deadline={deadline} timezone="America/New_York" />);

      expect(screen.getByText('30s')).toBeInTheDocument();
    });

    it('shows "Submission closed" without urgency styling when deadline has passed', () => {
      const deadline = deadlineFromNow(-60); // 1 min ago
      const { container } = render(
        <DeadlineCountdown deadline={deadline} timezone="America/New_York" />
      );

      expect(screen.getByText('Submission closed')).toBeInTheDocument();
      // F7: should NOT have urgent red/pulse styling
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('text-muted-foreground');
      expect(wrapper.className).not.toContain('text-red');
      expect(wrapper.className).not.toContain('animate-pulse');
    });

    it('shows "Submission closed" at exactly 0s', () => {
      const deadline = deadlineFromNow(0);
      render(<DeadlineCountdown deadline={deadline} timezone="America/New_York" />);

      expect(screen.getByText('Submission closed')).toBeInTheDocument();
    });
  });

  describe('exact boundaries', () => {
    it('shows "1h 0m 0s" at exactly 1 hour', () => {
      const deadline = deadlineFromNow(3600);
      render(<DeadlineCountdown deadline={deadline} timezone="America/New_York" />);

      expect(screen.getByText('1h 0m 0s')).toBeInTheDocument();
    });

    it('shows "1m 0s" at exactly 1 minute', () => {
      const deadline = deadlineFromNow(60);
      render(<DeadlineCountdown deadline={deadline} timezone="America/New_York" />);

      expect(screen.getByText('1m 0s')).toBeInTheDocument();
    });
  });

  describe('urgency styling', () => {
    it('shows normal styling for >2h', () => {
      const deadline = deadlineFromNow(7201); // 2h + 1s
      const { container } = render(
        <DeadlineCountdown deadline={deadline} timezone="America/New_York" />
      );

      const inner = getCountdownInner(container);
      expect(inner.className).toContain('text-muted-foreground');
      expect(inner.className).not.toContain('text-amber');
      expect(inner.className).not.toContain('text-red');
    });

    it('shows warning styling at exactly 2h', () => {
      const deadline = deadlineFromNow(7200); // exactly 2h
      const { container } = render(
        <DeadlineCountdown deadline={deadline} timezone="America/New_York" />
      );

      const inner = getCountdownInner(container);
      expect(inner.className).toContain('text-amber-600');
    });

    it('shows urgent styling at exactly 10min', () => {
      const deadline = deadlineFromNow(600); // exactly 10min
      const { container } = render(
        <DeadlineCountdown deadline={deadline} timezone="America/New_York" />
      );

      const inner = getCountdownInner(container);
      expect(inner.className).toContain('text-red-600');
    });

    it('shows warning styling at 10min + 1s (just outside urgent)', () => {
      const deadline = deadlineFromNow(601); // 10m 1s
      const { container } = render(
        <DeadlineCountdown deadline={deadline} timezone="America/New_York" />
      );

      const inner = getCountdownInner(container);
      expect(inner.className).toContain('text-amber-600');
      expect(inner.className).not.toContain('text-red');
    });
  });

  describe('timer behavior', () => {
    it('updates countdown every second', () => {
      const deadline = deadlineFromNow(5); // 5s
      render(<DeadlineCountdown deadline={deadline} timezone="America/New_York" />);

      expect(screen.getByText('5s')).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByText('4s')).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByText('3s')).toBeInTheDocument();
    });

    it('cleans up interval on unmount', () => {
      const deadline = deadlineFromNow(60);
      const { unmount } = render(
        <DeadlineCountdown deadline={deadline} timezone="America/New_York" />
      );

      unmount();
      // Advancing timers after unmount should not throw
      expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('handles invalid date gracefully', () => {
      render(<DeadlineCountdown deadline="invalid-date" timezone="America/New_York" />);
      expect(screen.getByText('Invalid deadline')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const deadline = deadlineFromNow(3600);
      const { container } = render(
        <DeadlineCountdown deadline={deadline} timezone="America/New_York" className="test-class" />
      );

      const outerEl = container.firstChild as HTMLElement;
      expect(outerEl.className).toContain('test-class');
    });

    it('has aria-live attribute for accessibility', () => {
      const deadline = deadlineFromNow(3600);
      const { container } = render(
        <DeadlineCountdown deadline={deadline} timezone="America/New_York" />
      );

      const outerEl = container.firstChild as HTMLElement;
      expect(outerEl).toHaveAttribute('aria-live', 'polite');
    });
  });
});
