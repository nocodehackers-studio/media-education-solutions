/**
 * MediaViewer Unit Tests - Story 5.2 (AC2), enhanced in Story 5.3
 * Tests photo/video media display for judge review
 * 5.3: expand button, lightbox, video loading/error states, controls hint
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MediaViewer } from './MediaViewer';

describe('MediaViewer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.style.overflow = '';
  });

  // --- Existing Story 5.2 tests ---

  it('renders img tag for photo submissions', () => {
    render(
      <MediaViewer
        mediaType="photo"
        mediaUrl="https://cdn.example.com/photo.jpg"
        participantCode="ABC123"
      />,
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/photo.jpg');
  });

  it('photo alt text includes participant code', () => {
    render(
      <MediaViewer
        mediaType="photo"
        mediaUrl="https://cdn.example.com/photo.jpg"
        participantCode="ABC123"
      />,
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Submission by ABC123');
  });

  it('renders iframe for video submissions', () => {
    render(
      <MediaViewer
        mediaType="video"
        mediaUrl="https://iframe.mediadelivery.net/embed/lib-1/vid-1"
        participantCode="DEF456"
      />,
    );

    const iframe = screen.getByTitle('Video submission by DEF456');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe).toHaveAttribute(
      'src',
      'https://iframe.mediadelivery.net/embed/lib-1/vid-1?autoplay=false&preload=true&responsive=true',
    );
  });

  it('video iframe has correct Bunny Stream URL with query params', () => {
    render(
      <MediaViewer
        mediaType="video"
        mediaUrl="https://iframe.mediadelivery.net/embed/lib-1/vid-1"
        participantCode="DEF456"
      />,
    );

    const iframe = screen.getByTitle('Video submission by DEF456');
    expect(iframe.getAttribute('src')).toContain('autoplay=false');
    expect(iframe.getAttribute('src')).toContain('preload=true');
  });

  it('shows placeholder with photo icon when media URL is null for photo', () => {
    const { container } = render(
      <MediaViewer mediaType="photo" mediaUrl={null} participantCode="ABC123" />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows placeholder with video icon when media URL is null for video', () => {
    const { container } = render(
      <MediaViewer mediaType="video" mediaUrl={null} participantCode="DEF456" />,
    );

    expect(screen.queryByTitle(/Video submission/)).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  // --- Story 5.3: Photo expand/lightbox tests ---

  it('photo: shows "Expand" button', () => {
    render(
      <MediaViewer
        mediaType="photo"
        mediaUrl="https://cdn.example.com/photo.jpg"
        participantCode="ABC123"
      />,
    );

    const expandButton = screen.getByLabelText('Expand photo');
    expect(expandButton).toBeInTheDocument();
  });

  it('photo: clicking expand opens PhotoZoomViewer', () => {
    render(
      <MediaViewer
        mediaType="photo"
        mediaUrl="https://cdn.example.com/photo.jpg"
        participantCode="ABC123"
      />,
    );

    // Before clicking, no dialog
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const expandButton = screen.getByLabelText('Expand photo');
    fireEvent.click(expandButton);

    // After clicking, dialog is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // --- Story 5.3: Video loading/error/controls tests ---

  it('video: shows loading skeleton initially', () => {
    const { container } = render(
      <MediaViewer
        mediaType="video"
        mediaUrl="https://iframe.mediadelivery.net/embed/lib-1/vid-1"
        participantCode="DEF456"
      />,
    );

    // Skeleton should be visible (div with animate-pulse from shadcn Skeleton)
    const skeleton = container.querySelector('[class*="aspect-video"]:not(iframe)');
    expect(skeleton).toBeInTheDocument();

    // Iframe should be hidden
    const iframe = screen.getByTitle('Video submission by DEF456');
    expect(iframe.className).toContain('hidden');
  });

  it('video: hides skeleton after iframe loads', () => {
    render(
      <MediaViewer
        mediaType="video"
        mediaUrl="https://iframe.mediadelivery.net/embed/lib-1/vid-1"
        participantCode="DEF456"
      />,
    );

    const iframe = screen.getByTitle('Video submission by DEF456');

    act(() => {
      fireEvent.load(iframe);
    });

    // After load, iframe should not be hidden
    expect(iframe.className).not.toContain('hidden');
  });

  it('video: shows "Video unavailable" after timeout', () => {
    render(
      <MediaViewer
        mediaType="video"
        mediaUrl="https://iframe.mediadelivery.net/embed/lib-1/vid-1"
        participantCode="DEF456"
      />,
    );

    // Advance past the 15s timeout
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(screen.getByText('Video unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('video: retry button remounts iframe', () => {
    render(
      <MediaViewer
        mediaType="video"
        mediaUrl="https://iframe.mediadelivery.net/embed/lib-1/vid-1"
        participantCode="DEF456"
      />,
    );

    // Trigger error state
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(screen.getByText('Video unavailable')).toBeInTheDocument();

    // Click retry
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryButton);

    // Error should be gone, loading skeleton should reappear
    expect(screen.queryByText('Video unavailable')).not.toBeInTheDocument();
  });

  it('video: shows keyboard controls hint text after loading', () => {
    render(
      <MediaViewer
        mediaType="video"
        mediaUrl="https://iframe.mediadelivery.net/embed/lib-1/vid-1"
        participantCode="DEF456"
      />,
    );

    const iframe = screen.getByTitle('Video submission by DEF456');

    act(() => {
      fireEvent.load(iframe);
    });

    expect(
      screen.getByText(/Click video to use keyboard controls/),
    ).toBeInTheDocument();
  });

  it('video: iframe has loading="eager" for preload optimization', () => {
    render(
      <MediaViewer
        mediaType="video"
        mediaUrl="https://iframe.mediadelivery.net/embed/lib-1/vid-1"
        participantCode="DEF456"
      />,
    );

    const iframe = screen.getByTitle('Video submission by DEF456');
    expect(iframe).toHaveAttribute('loading', 'eager');
  });

  it('video: embed URL includes responsive=true param', () => {
    render(
      <MediaViewer
        mediaType="video"
        mediaUrl="https://iframe.mediadelivery.net/embed/lib-1/vid-1"
        participantCode="DEF456"
      />,
    );

    const iframe = screen.getByTitle('Video submission by DEF456');
    expect(iframe.getAttribute('src')).toContain('responsive=true');
  });
});
