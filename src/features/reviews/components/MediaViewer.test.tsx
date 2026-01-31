/**
 * MediaViewer Unit Tests - Story 5.2 (AC2)
 * Tests photo/video media display for judge review
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MediaViewer } from './MediaViewer';

describe('MediaViewer', () => {
  it('renders img tag for photo submissions', () => {
    render(
      <MediaViewer
        mediaType="photo"
        mediaUrl="https://cdn.example.com/photo.jpg"
        participantCode="ABC123"
      />
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
      />
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
      />
    );

    const iframe = screen.getByTitle('Video submission by DEF456');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe).toHaveAttribute(
      'src',
      'https://iframe.mediadelivery.net/embed/lib-1/vid-1?autoplay=false&preload=true'
    );
  });

  it('video iframe has correct Bunny Stream URL with query params', () => {
    render(
      <MediaViewer
        mediaType="video"
        mediaUrl="https://iframe.mediadelivery.net/embed/lib-1/vid-1"
        participantCode="DEF456"
      />
    );

    const iframe = screen.getByTitle('Video submission by DEF456');
    expect(iframe.getAttribute('src')).toContain('autoplay=false');
    expect(iframe.getAttribute('src')).toContain('preload=true');
  });

  it('shows placeholder with photo icon when media URL is null for photo', () => {
    const { container } = render(
      <MediaViewer mediaType="photo" mediaUrl={null} participantCode="ABC123" />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    // Should render placeholder div
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows placeholder with video icon when media URL is null for video', () => {
    const { container } = render(
      <MediaViewer mediaType="video" mediaUrl={null} participantCode="DEF456" />
    );

    expect(screen.queryByTitle(/Video submission/)).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
