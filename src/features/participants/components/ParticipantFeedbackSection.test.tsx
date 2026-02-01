// Story 6-7: Tests for ParticipantFeedbackSection component
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ParticipantFeedbackSection } from './ParticipantFeedbackSection'
import { type ParticipantFeedback } from '@/features/participants'

describe('ParticipantFeedbackSection', () => {
  const baseFeedback: ParticipantFeedback = {
    rating: 7,
    ratingTierLabel: 'Advanced Producer',
    feedback: 'Excellent work on the cinematography and storytelling.',
  }

  it('renders the tier label prominently', () => {
    render(<ParticipantFeedbackSection feedback={baseFeedback} />)
    expect(screen.getByText('Advanced Producer')).toBeInTheDocument()
  })

  it('renders the numeric score', () => {
    render(<ParticipantFeedbackSection feedback={baseFeedback} />)
    expect(screen.getByText('7 out of 10')).toBeInTheDocument()
  })

  it('renders the feedback text', () => {
    render(<ParticipantFeedbackSection feedback={baseFeedback} />)
    expect(
      screen.getByText('Excellent work on the cinematography and storytelling.')
    ).toBeInTheDocument()
  })

  it('renders "No feedback provided" when feedback is empty', () => {
    render(
      <ParticipantFeedbackSection
        feedback={{ ...baseFeedback, feedback: '' }}
      />
    )
    expect(screen.getByText('No feedback provided')).toBeInTheDocument()
  })

  it('renders the heading "Your Feedback"', () => {
    render(<ParticipantFeedbackSection feedback={baseFeedback} />)
    expect(screen.getByText('Your Feedback')).toBeInTheDocument()
  })

  it('does not render judge name or ranking position', () => {
    const { container } = render(
      <ParticipantFeedbackSection feedback={baseFeedback} />
    )
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/judge/i)
    expect(text).not.toMatch(/1st|2nd|3rd|rank/i)
  })

  it('renders different tier labels correctly', () => {
    render(
      <ParticipantFeedbackSection
        feedback={{ rating: 2, ratingTierLabel: 'Developing Skills', feedback: 'Keep practicing.' }}
      />
    )
    expect(screen.getByText('Developing Skills')).toBeInTheDocument()
    expect(screen.getByText('2 out of 10')).toBeInTheDocument()
  })
})
