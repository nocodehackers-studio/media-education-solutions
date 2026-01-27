/**
 * DeadlineCountdown Unit Tests
 * Tests countdown display and urgency levels (AC6, AC7)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeadlineCountdown } from './DeadlineCountdown'

describe('DeadlineCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders countdown text for future deadline', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
    render(<DeadlineCountdown deadline={futureDate.toISOString()} />)

    expect(screen.getByText(/due/i)).toBeInTheDocument()
    expect(screen.queryByText(/deadline passed/i)).not.toBeInTheDocument()
  })

  it('shows "Deadline passed" for past deadline', () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    render(<DeadlineCountdown deadline={pastDate.toISOString()} />)

    expect(screen.getByText(/deadline passed/i)).toBeInTheDocument()
  })

  describe('urgency levels', () => {
    it('shows normal styling for deadline > 2 hours away', () => {
      const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours
      const { container } = render(
        <DeadlineCountdown deadline={futureDate.toISOString()} />
      )

      const countdownEl = container.firstChild as HTMLElement
      expect(countdownEl.className).toContain('text-muted-foreground')
      expect(countdownEl.className).not.toContain('text-amber')
      expect(countdownEl.className).not.toContain('text-red')
    })

    it('shows warning styling for deadline < 2 hours away (AC6)', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      const { container } = render(
        <DeadlineCountdown deadline={futureDate.toISOString()} />
      )

      const countdownEl = container.firstChild as HTMLElement
      expect(countdownEl.className).toContain('text-amber-600')
    })

    it('shows urgent styling for deadline < 10 minutes away (AC7)', () => {
      const futureDate = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      const { container } = render(
        <DeadlineCountdown deadline={futureDate.toISOString()} />
      )

      const countdownEl = container.firstChild as HTMLElement
      expect(countdownEl.className).toContain('text-red-600')
      expect(countdownEl.className).toContain('motion-safe:animate-pulse')
    })

    it('shows warning at exactly 2 hours (boundary)', () => {
      const futureDate = new Date(Date.now() + 120 * 60 * 1000) // exactly 2 hours
      const { container } = render(
        <DeadlineCountdown deadline={futureDate.toISOString()} />
      )

      const countdownEl = container.firstChild as HTMLElement
      expect(countdownEl.className).toContain('text-amber-600')
    })

    it('shows normal at 2 hours 1 minute (just outside warning)', () => {
      const futureDate = new Date(Date.now() + 121 * 60 * 1000) // 2h 1m
      const { container } = render(
        <DeadlineCountdown deadline={futureDate.toISOString()} />
      )

      const countdownEl = container.firstChild as HTMLElement
      expect(countdownEl.className).toContain('text-muted-foreground')
      expect(countdownEl.className).not.toContain('text-amber')
    })

    it('shows urgent at exactly 10 minutes (boundary)', () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000) // exactly 10 minutes
      const { container } = render(
        <DeadlineCountdown deadline={futureDate.toISOString()} />
      )

      const countdownEl = container.firstChild as HTMLElement
      expect(countdownEl.className).toContain('text-red-600')
    })
  })

  it('renders clock icon', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    render(<DeadlineCountdown deadline={futureDate.toISOString()} />)

    // Lucide icons have role="img" by default
    const icon = document.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const { container } = render(
      <DeadlineCountdown deadline={futureDate.toISOString()} className="test-class" />
    )

    const countdownEl = container.firstChild as HTMLElement
    expect(countdownEl.className).toContain('test-class')
  })

  it('handles invalid date gracefully', () => {
    render(<DeadlineCountdown deadline="invalid-date" />)
    expect(screen.getByText(/invalid deadline/i)).toBeInTheDocument()
  })

  it('has aria-live for accessibility', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const { container } = render(
      <DeadlineCountdown deadline={futureDate.toISOString()} />
    )

    const countdownEl = container.firstChild as HTMLElement
    expect(countdownEl).toHaveAttribute('aria-live', 'polite')
  })
})
