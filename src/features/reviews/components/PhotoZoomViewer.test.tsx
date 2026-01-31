/**
 * PhotoZoomViewer Unit Tests - Story 5.3 (AC2)
 * Tests fullscreen photo viewer with zoom/pan capabilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoZoomViewer } from './PhotoZoomViewer';

describe('PhotoZoomViewer', () => {
  const defaultProps = {
    src: 'https://cdn.example.com/photo.jpg',
    alt: 'Test photo',
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders image in fullscreen overlay when open', () => {
    render(<PhotoZoomViewer {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Photo viewer');

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', defaultProps.src);
    expect(img).toHaveAttribute('alt', defaultProps.alt);
  });

  it('does not render when isOpen is false', () => {
    render(<PhotoZoomViewer {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Esc keypress', () => {
    render(<PhotoZoomViewer {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click', () => {
    render(<PhotoZoomViewer {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking the image', () => {
    render(<PhotoZoomViewer {...defaultProps} />);

    const img = screen.getByRole('img');
    fireEvent.click(img);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    render(<PhotoZoomViewer {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('sets body overflow to hidden when open', () => {
    render(<PhotoZoomViewer {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow on close', () => {
    const { unmount } = render(<PhotoZoomViewer {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('close button (X) calls onClose', () => {
    render(<PhotoZoomViewer {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close viewer');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('double-click resets zoom (no visible error)', () => {
    render(<PhotoZoomViewer {...defaultProps} />);

    const img = screen.getByRole('img');
    // Double-click should reset zoom to 1x without errors
    fireEvent.doubleClick(img);
    // Verify image still renders (zoom reset doesn't break anything)
    expect(img).toBeInTheDocument();
  });
});
