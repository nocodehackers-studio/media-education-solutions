// Story 4-6: Tests for PhotoLightbox component
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoLightbox } from './PhotoLightbox'

describe('PhotoLightbox', () => {
  const defaultProps = {
    src: 'https://example.com/photo.jpg',
    alt: 'Test photo',
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('renders image with correct src and alt', () => {
    render(<PhotoLightbox {...defaultProps} />)

    const img = screen.getByAltText('Test photo')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('renders dialog with correct aria attributes', () => {
    render(<PhotoLightbox {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-label', 'Photo preview')
  })

  it('renders close button with accessible label', () => {
    render(<PhotoLightbox {...defaultProps} />)

    expect(
      screen.getByRole('button', { name: 'Close preview' })
    ).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    render(<PhotoLightbox {...defaultProps} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Close preview' }))

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key pressed', () => {
    render(<PhotoLightbox {...defaultProps} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose for non-Escape keys', () => {
    render(<PhotoLightbox {...defaultProps} />)

    fireEvent.keyDown(document, { key: 'Enter' })

    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when backdrop clicked', () => {
    render(<PhotoLightbox {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when image clicked', () => {
    render(<PhotoLightbox {...defaultProps} />)

    fireEvent.click(screen.getByAltText('Test photo'))

    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('sets body overflow to hidden on mount', () => {
    render(<PhotoLightbox {...defaultProps} />)

    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow on unmount', () => {
    const { unmount } = render(<PhotoLightbox {...defaultProps} />)

    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
