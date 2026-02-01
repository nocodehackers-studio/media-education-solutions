// Story 6-6: Tests for WinnerCard component

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WinnerCard } from './WinnerCard';
import type { EffectiveWinner } from '@/features/contests';

// Mock PhotoLightboxWithDownload (portal-based, tricky in tests)
vi.mock('./PhotoLightboxWithDownload', () => ({
  PhotoLightboxWithDownload: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="photo-lightbox">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const mockOnDownload = vi.fn();

const photoWinner: EffectiveWinner = {
  rank: 1,
  submissionId: 'sub-1',
  participantName: 'Alice Johnson',
  institution: 'Springfield School',
  categoryName: 'Best Photo',
  mediaType: 'photo',
  mediaUrl: 'https://example.com/photo.jpg',
  thumbnailUrl: null,
  vacant: false,
};

const vacantWinner: EffectiveWinner = {
  rank: 2,
  submissionId: '',
  participantName: '',
  institution: '',
  categoryName: 'Best Photo',
  mediaType: '',
  mediaUrl: '',
  thumbnailUrl: null,
  vacant: true,
};

describe('WinnerCard', () => {
  it('should display winner info for a photo winner', () => {
    render(
      <WinnerCard
        winner={photoWinner}
        rank={1}
        contestCode="ABC123"
        onDownload={mockOnDownload}
        downloadDisabled={false}
      />
    );

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Springfield School')).toBeInTheDocument();
    expect(screen.getByText('1st Place')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeEnabled();
  });

  it('should show vacant state', () => {
    render(
      <WinnerCard
        winner={vacantWinner}
        rank={2}
        contestCode="ABC123"
        onDownload={mockOnDownload}
        downloadDisabled={false}
      />
    );

    expect(screen.getByText('Position vacant')).toBeInTheDocument();
    expect(screen.getByText('2nd Place')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
  });

  it('should disable download button when downloadDisabled is true', () => {
    render(
      <WinnerCard
        winner={photoWinner}
        rank={1}
        contestCode="ABC123"
        onDownload={mockOnDownload}
        downloadDisabled={true}
      />
    );

    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
  });

  it('should call onDownload with correct filename when download clicked', async () => {
    const user = userEvent.setup();
    render(
      <WinnerCard
        winner={photoWinner}
        rank={1}
        contestCode="ABC123"
        onDownload={mockOnDownload}
        downloadDisabled={false}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Download' }));
    expect(mockOnDownload).toHaveBeenCalledWith(
      'https://example.com/photo.jpg',
      expect.stringContaining('ABC123')
    );
  });

  it('should display 3rd place styling', () => {
    const thirdPlace: EffectiveWinner = { ...photoWinner, rank: 3 };
    render(
      <WinnerCard
        winner={thirdPlace}
        rank={3}
        contestCode="ABC123"
        onDownload={mockOnDownload}
        downloadDisabled={false}
      />
    );

    expect(screen.getByText('3rd Place')).toBeInTheDocument();
  });
});
