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
      expect(countdownEl.className).toContain('animate-pulse')
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
})
